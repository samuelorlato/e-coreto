package br.com.fiap.ecoreto.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class SystemSetting extends BaseEntity {

    public static final String QUORUM_PERCENTAGE = "quorum_percentage";
    public static final String MIN_VOTES_FLOOR = "min_votes_floor";
    public static final String APPROVAL_PERCENTAGE = "approval_percentage";
    public static final String STALE_AFTER_DAYS = "stale_after_days";
    public static final String MAX_CATEGORIES_PER_PROPOSAL = "max_categories_per_proposal";

    private final String key;
    private BigDecimal value;
    private final String description;

    public SystemSetting(UUID id, String key, BigDecimal value, String description,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.key = key;
        this.value = value;
        this.description = description;
    }

    public void changeValue(BigDecimal newValue) {
        this.value = newValue;
    }

    public String getKey() {
        return key;
    }

    public BigDecimal getValue() {
        return value;
    }

    public String getDescription() {
        return description;
    }
}
