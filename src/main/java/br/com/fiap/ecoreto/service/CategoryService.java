package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.CategoryDao;
import br.com.fiap.ecoreto.exception.ConflictException;
import br.com.fiap.ecoreto.exception.ForbiddenException;
import br.com.fiap.ecoreto.exception.NotFoundException;
import br.com.fiap.ecoreto.model.Category;
import br.com.fiap.ecoreto.model.User;

import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class CategoryService {

    public List<Category> list() {
        return Tx.read(c -> new CategoryDao(c).findAll());
    }

    public Category create(User me, String name) {
        String cleanName = validName(name);
        String slug = toSlug(cleanName);
        return Tx.write(c -> {
            CategoryDao dao = new CategoryDao(c);
            if (dao.findBySlug(slug).isPresent()) {
                throw new ConflictException("Já existe uma categoria com esse nome.");
            }
            Category category = new Category(cleanName, slug, me.getId());
            dao.insert(category);
            return category;
        });
    }

    public Category rename(User me, UUID id, String name) {
        String cleanName = validName(name);
        String slug = toSlug(cleanName);
        return Tx.write(c -> {
            CategoryDao dao = new CategoryDao(c);
            Category category = dao.findById(id)
                    .orElseThrow(() -> new NotFoundException("Categoria não encontrada."));
            checkCanChange(me, category, dao.isInUse(id));
            Optional<Category> sameSlug = dao.findBySlug(slug);
            if (sameSlug.isPresent() && !sameSlug.get().getId().equals(id)) {
                throw new ConflictException("Já existe uma categoria com esse nome.");
            }
            category.rename(cleanName, slug);
            dao.update(category);
            return category;
        });
    }

    public void delete(User me, UUID id) {
        Tx.write(c -> {
            CategoryDao dao = new CategoryDao(c);
            Category category = dao.findById(id)
                    .orElseThrow(() -> new NotFoundException("Categoria não encontrada."));
            checkCanChange(me, category, dao.isInUse(id));
            dao.delete(id);
            return null;
        });
    }

    private void checkCanChange(User me, Category category, boolean inUse) {
        if (!me.isAuthority() && !category.isCreatedBy(me.getId())) {
            throw new ForbiddenException("Só quem criou a categoria ou uma autoridade pode alterá-la.");
        }
        if (inUse) {
            throw new ConflictException("Esta categoria já é usada por uma proposta e não pode ser alterada.");
        }
    }

    private String validName(String name) {
        String clean = Validator.clean(name);
        Validator v = new Validator().required(clean, "Nome da categoria", 60);
        v.check(clean == null || !toSlug(clean).isEmpty(), "Nome da categoria precisa ter letras ou números.");
        v.throwIfInvalid();
        return clean.replaceAll("\\s+", " ");
    }

    static String toSlug(String name) {
        String noAccents = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return noAccents.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
    }
}
