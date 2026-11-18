package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.SystemSetting;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SettingResponse {

    public String key;
    public BigDecimal value;
    public String description;
    public LocalDateTime updatedAt;

    public static SettingResponse from(SystemSetting s) {
        SettingResponse r = new SettingResponse();
        r.key = s.getKey();
        r.value = s.getValue().stripTrailingZeros();
        r.description = s.getDescription();
        r.updatedAt = s.getUpdatedAt();
        return r;
    }
}
