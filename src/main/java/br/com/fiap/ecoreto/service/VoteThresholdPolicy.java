package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.VoteCount;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Limiar de apoio (RN-11 e RN-13). A proposta atinge o limiar quando cumpre as duas condições:
 * <ol>
 *   <li>Quórum: votos ≥ max(piso mínimo, quorum_percentage% dos moradores cadastrados);</li>
 *   <li>Maioria: votos a favor ≥ approval_percentage% dos votos computados.</li>
 * </ol>
 */
public final class VoteThresholdPolicy {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private VoteThresholdPolicy() {
    }

    /** Número mínimo de votos (quórum dinâmico, acompanha o total de moradores). */
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
        // inFavor * 100 >= approval% * total  (sem divisão, para não ter arredondamento)
        BigDecimal left = BigDecimal.valueOf(count.getInFavor()).multiply(HUNDRED);
        BigDecimal right = settings.approvalPercentage().multiply(BigDecimal.valueOf(count.getTotal()));
        return left.compareTo(right) >= 0;
    }

    public static boolean isReached(VoteCount count, int residents, Settings settings) {
        return hasQuorum(count, residents, settings) && hasMajority(count, settings);
    }

    /** Percentual de votos a favor, com 1 casa decimal (0 se não há votos). */
    public static double favorPercentage(VoteCount count) {
        if (count.getTotal() == 0) {
            return 0;
        }
        return BigDecimal.valueOf(count.getInFavor()).multiply(HUNDRED)
                .divide(BigDecimal.valueOf(count.getTotal()), 1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
