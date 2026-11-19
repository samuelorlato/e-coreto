package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.ReportDao;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ReportService {

    public List<Map<String, Object>> ranking(Integer limit) {
        int size = limit == null ? 10 : Math.max(1, Math.min(limit, 50));
        return Tx.read(c -> new ReportDao(c).ranking(size));
    }

    public List<Map<String, Object>> votesByRegion() {
        return Tx.read(c -> new ReportDao(c).votesByRegion());
    }

    public List<Map<String, Object>> byCategory() {
        return Tx.read(c -> new ReportDao(c).byCategory());
    }

    public Map<String, Object> averageTimes() {
        return Tx.read(c -> new ReportDao(c).averageTimes());
    }

    public List<Map<String, Object>> stale(Integer days) {
        return Tx.read(c -> {
            int d = days != null && days > 0 ? days : Settings.load(c).staleAfterDays();
            return new ReportDao(c).stale(d);
        });
    }

    public Map<String, Object> participation() {
        Map<String, Object> raw = Tx.read(c -> new ReportDao(c).participationCounts());
        int residents = number(raw, "residents");
        int voted = number(raw, "residentsWhoVoted");
        int proposals = number(raw, "proposals");
        int reached = number(raw, "reachedThreshold");
        int responded = number(raw, "responded");
        int decided = number(raw, "decided");
        int approved = number(raw, "approved");
        int completed = number(raw, "completed");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("residents", residents);
        result.put("residentsWhoVoted", voted);
        result.put("participationRate", rate(voted, residents));
        result.put("proposals", proposals);
        result.put("reachedThreshold", reached);
        result.put("thresholdRate", rate(reached, proposals));
        result.put("decided", decided);
        result.put("responded", responded);
        result.put("responseRate", rate(responded, reached));
        result.put("approved", approved);
        result.put("completed", completed);
        result.put("executionRate", rate(completed, approved));
        return result;
    }

    private static int number(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value instanceof Number n ? n.intValue() : 0;
    }

    private static double rate(int part, int total) {
        if (total == 0) {
            return 0;
        }
        return BigDecimal.valueOf(part * 100L)
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
