package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.SystemSettingDao;
import br.com.fiap.ecoreto.model.SystemSetting;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public final class Settings {

    private final Map<String, BigDecimal> values;

    private Settings(Map<String, BigDecimal> values) {
        this.values = values;
    }

    static Settings load(Connection c) throws SQLException {
        Map<String, BigDecimal> map = new HashMap<>();
        for (SystemSetting s : new SystemSettingDao(c).findAll()) {
            map.put(s.getKey(), s.getValue());
        }
        return new Settings(map);
    }

    public BigDecimal quorumPercentage() {
        return get(SystemSetting.QUORUM_PERCENTAGE, 10);
    }

    public int minVotesFloor() {
        return get(SystemSetting.MIN_VOTES_FLOOR, 5).intValue();
    }

    public BigDecimal approvalPercentage() {
        return get(SystemSetting.APPROVAL_PERCENTAGE, 60);
    }

    public int staleAfterDays() {
        return get(SystemSetting.STALE_AFTER_DAYS, 90).intValue();
    }

    public int maxCategoriesPerProposal() {
        return get(SystemSetting.MAX_CATEGORIES_PER_PROPOSAL, 3).intValue();
    }

    private BigDecimal get(String key, int defaultValue) {
        return values.getOrDefault(key, BigDecimal.valueOf(defaultValue));
    }
}
