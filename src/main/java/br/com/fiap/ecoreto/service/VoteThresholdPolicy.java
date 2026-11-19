package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.VoteCount;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class VoteThresholdPolicy {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private VoteThresholdPolicy() {
    }

    public static int requiredVotes(int residents, Settings settings) {
        int byPercentage = BigDecimal.valueOf(residents)
                .multiply(settings.quorumPercentage())
                .divide(HUNDRED, 0, RoundingMode.CEILING)
                .intValue();
        return Math.max(settings.minVotesFloor(), byPercentage);
    }

    public static boolean hasQuorum(VoteCount count, int residents, Settings settings) {
        return count.getTotal() >= requiredVotes(residents, settings);
    }

    public static boolean hasMajority(VoteCount count, Settings settings) {
        if (count.getTotal() == 0) {
            return false;
        }
        BigDecimal left = BigDecimal.valueOf(count.getInFavor()).multiply(HUNDRED);
        BigDecimal right = settings.approvalPercentage().multiply(BigDecimal.valueOf(count.getTotal()));
        return left.compareTo(right) >= 0;
    }

    public static boolean isReached(VoteCount count, int residents, Settings settings) {
        return hasQuorum(count, residents, settings) && hasMajority(count, settings);
    }

    public static double favorPercentage(VoteCount count) {
        if (count.getTotal() == 0) {
            return 0;
        }
        return BigDecimal.valueOf(count.getInFavor()).multiply(HUNDRED)
                .divide(BigDecimal.valueOf(count.getTotal()), 1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
