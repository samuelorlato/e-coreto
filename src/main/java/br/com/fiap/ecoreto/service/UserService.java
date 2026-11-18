package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.AddressDao;
import br.com.fiap.ecoreto.dao.UserDao;
import br.com.fiap.ecoreto.exception.ConflictException;
import br.com.fiap.ecoreto.exception.NotFoundException;
import br.com.fiap.ecoreto.model.Address;
import br.com.fiap.ecoreto.model.Resident;
import br.com.fiap.ecoreto.model.User;
import br.com.fiap.ecoreto.security.PasswordHasher;

import java.util.Optional;
import java.util.UUID;

/** Cadastro, autenticação e endereço dos usuários (RN-01 a RN-03). */
public class UserService {

    private static final int MIN_PASSWORD = 8;

    /** Usado pelo BasicAuthFilter. Devolve vazio se o e-mail não existe ou a senha não confere. */
    public Optional<User> authenticate(String email, String password) {
        if (email == null || email.isBlank() || password == null) {
            return Optional.empty();
        }
        Optional<User> user = Tx.read(c -> new UserDao(c).findByEmail(email.trim().toLowerCase()));
        return user.filter(u -> PasswordHasher.matches(password, u.getPasswordSalt(), u.getPasswordHash()));
    }

    /**
     * RN-01: o cadastro público cria sempre um morador. Autoridades só entram por carga administrativa.
     * RN-02: e-mail único (em minúsculas) e senha guardada só como hash + sal.
     */
    public User registerResident(String firstName, String lastName, String email,
                                 String password, Address address) {
        String cleanFirst = Validator.clean(firstName);
        String cleanLast = Validator.clean(lastName);
        String cleanEmail = Validator.clean(email) == null ? null : email.trim().toLowerCase();

        Validator v = new Validator()
                .required(cleanFirst, "Nome", 60)
                .required(cleanLast, "Sobrenome", 80)
                .email(cleanEmail)
                .check(password != null && password.length() >= MIN_PASSWORD,
                        "Senha deve ter pelo menos " + MIN_PASSWORD + " caracteres.")
                .check(password == null || password.length() <= 100, "Senha deve ter no máximo 100 caracteres.");
        validateAddress(v, address);
        v.throwIfInvalid();

        return Tx.write(c -> {
            UserDao users = new UserDao(c);
            if (users.existsByEmail(cleanEmail)) {
                throw new ConflictException("Este e-mail já está cadastrado.");
            }
            String salt = PasswordHasher.generateSalt();
            String hash = PasswordHasher.hash(password, salt);
            Resident resident = new Resident(cleanFirst, cleanLast, cleanEmail, hash, salt, address);
            new AddressDao(c).insert(address);
            users.insert(resident);
            return resident;
        });
    }

    public User findById(UUID id) {
        return Tx.read(c -> new UserDao(c).findById(id))
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
    }

    /**
     * Troca o endereço do usuário logado. O endereço é imutável: grava um novo registro
     * e os votos antigos continuam com o endereço da época (RN-10).
     */
    public User changeAddress(User me, Address newAddress) {
        Validator v = new Validator();
        validateAddress(v, newAddress);
        v.throwIfInvalid();

        return Tx.write(c -> {
            new AddressDao(c).insert(newAddress);
            me.moveTo(newAddress);
            new UserDao(c).updateAddress(me);
            return me;
        });
    }

    /** RN-03: todo usuário tem endereço completo. Limites iguais aos do script.sql. */
    static void validateAddress(Validator v, Address a) {
        if (a == null) {
            v.check(false, "Endereço é obrigatório.");
            return;
        }
        v.required(a.getStreet(), "Rua", 120)
                .required(a.getStreetNumber(), "Número", 10)
                .maxLength(a.getComplement(), "Complemento", 60)
                .required(a.getNeighborhood(), "Bairro", 80)
                .required(a.getCity(), "Cidade", 80)
                .required(a.getState(), "UF", 2)
                .matches(a.getState(), "^[A-Z]{2}$", "UF deve ter 2 letras (ex.: SP).")
                .required(a.getZipCode(), "CEP", 8)
                .matches(a.getZipCode(), "^[0-9]{8}$", "CEP deve ter 8 dígitos.")
                .check(a.getLatitude() == null || Math.abs(a.getLatitude()) <= 90, "Latitude inválida.")
                .check(a.getLongitude() == null || Math.abs(a.getLongitude()) <= 180, "Longitude inválida.");
    }
}
