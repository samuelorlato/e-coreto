package br.com.fiap.ecoreto.resource.dto;

import java.math.BigDecimal;

/** Corpo de PUT /settings/{key}. Ex.: { "value": 15 } */
public class SettingRequest {

    public BigDecimal value;
}
