package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.OfficialResponse;
import br.com.fiap.ecoreto.service.ResponseView;

import java.time.LocalDateTime;

public class OfficialResponseResponse {

    public String id;
    public String proposalId;
    public String content;
    public String proposalStatus;
    public String proposalStatusLabel;
    public String createdBy;
    public String authorName;
    public LocalDateTime createdAt;

    public static OfficialResponseResponse from(ResponseView view) {
        OfficialResponse o = view.getResponse();
        OfficialResponseResponse r = new OfficialResponseResponse();
        r.id = o.getId().toString();
        r.proposalId = o.getProposalId().toString();
        r.content = o.getContent();
        r.proposalStatus = o.getProposalStatus().name();
        r.proposalStatusLabel = o.getProposalStatus().getLabel();
        r.createdBy = o.getCreatedBy().toString();
        r.authorName = view.getAuthorName();
        r.createdAt = o.getCreatedAt();
        return r;
    }
}
