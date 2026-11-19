package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.model.ProposalStatusHistory;

public class HistoryEntryView {

    private final ProposalStatusHistory entry;
    private final String changedByName;

    HistoryEntryView(ProposalStatusHistory entry, String changedByName) {
        this.entry = entry;
        this.changedByName = changedByName;
    }

    public ProposalStatusHistory getEntry() {
        return entry;
    }

    public String getChangedByName() {
        return changedByName;
    }
}
