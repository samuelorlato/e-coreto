package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.SystemSettingDao;
import br.com.fiap.ecoreto.exception.NotFoundException;
import br.com.fiap.ecoreto.model.SystemSetting;
import br.com.fiap.ecoreto.model.User;

import java.math.BigDecimal;
import java.util.List;

public class SettingService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    public List<SystemSetting> list() {
        return Tx.read(c -> new SystemSettingDao(c).findAll());
    }

    public SystemSetting update(User me, String key, BigDecimal value) {
        ProposalService.requireAuthority(me, "Só autoridades podem alterar os parâmetros.");
        validate(key, value);

        return Tx.write(c -> {
            SystemSettingDao dao = new SystemSettingDao(c);
            SystemSetting setting = dao.findByKey(key)
                    .orElseThrow(() -> new NotFoundException("Parâmetro não encontrado: " + key));
            setting.changeValue(value);
            dao.update(setting);
            return setting;
        });
    }

    private void validate(String key, BigDecimal value) {
        Validator v = new Validator();
        if (value == null) {
            v.check(false, "value é obrigatório.");
            v.throwIfInvalid();
        }
        boolean integer = value.stripTrailingZeros().scale() <= 0;
        switch (key == null ? "" : key) {
            case SystemSetting.QUORUM_PERCENTAGE, SystemSetting.APPROVAL_PERCENTAGE ->
                    v.check(value.compareTo(BigDecimal.ZERO) > 0 && value.compareTo(HUNDRED) <= 0,
                            "O percentual deve ser maior que 0 e no máximo 100.");
            case SystemSetting.MIN_VOTES_FLOOR ->
                    v.check(integer && value.compareTo(BigDecimal.ONE) >= 0,
                            "O piso de votos deve ser um número inteiro de pelo menos 1.");
            case SystemSetting.STALE_AFTER_DAYS ->
                    v.check(integer && value.compareTo(BigDecimal.ONE) >= 0,
                            "O número de dias deve ser um inteiro de pelo menos 1.");
            case SystemSetting.MAX_CATEGORIES_PER_PROPOSAL ->
                    v.check(integer && value.compareTo(BigDecimal.ONE) >= 0
                                    && value.compareTo(BigDecimal.TEN) <= 0,
                            "O máximo de categorias deve ser um inteiro entre 1 e 10.");
            default -> {
            }
        }
        v.throwIfInvalid();
    }
}
