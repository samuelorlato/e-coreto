package br.com.fiap.ecoreto.resource.dto;

import java.util.List;

/** Corpo de POST /proposals e PUT /proposals/{id}. */
public class ProposalRequest {

    public String title;
    public String description;
    public String body;
    public List<String> categoryIds;
}
