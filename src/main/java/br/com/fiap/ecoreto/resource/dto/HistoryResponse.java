package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.ProposalStatusHistory;
import br.com.fiap.ecoreto.service.HistoryEntryView;

import java.time.LocalDateTime;

public class HistoryResponse {

    public String id;
    public String fromStatus;
    public String fromStatusLabel;
    public String toStatus;
    public String toStatusLabel;
    public String changedBy;
    public String changedByName;
    public boolean automatic;
    public LocalDateTime createdAt;

    public static HistoryResponse from(HistoryEntryView view) {
        ProposalStatusHistory h = view.getEntry();
        HistoryResponse r = new HistoryResponse();
        r.id = h.getId().toString();
        r.fromStatus = h.getFromStatus() == null ? null : h.getFromStatus().name();
        r.fromStatusLabel = h.getFromStatus() == null ? null : h.getFromStatus().getLabel();
        r.toStatus = h.getToStatus().name();
        r.toStatusLabel = h.getToStatus().getLabel();
        r.changedBy = h.getChangedBy() == null ? null : h.getChangedBy().toString();
        r.changedByName = view.getChangedByName();
        r.automatic = h.isAutomatic();
        r.createdAt = h.getCreatedAt();
        return r;
    }
}
