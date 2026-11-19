package br.com.fiap.ecoreto.dao;

public class VoteCount {

    private final int inFavor;
    private final int against;

    public VoteCount(int inFavor, int against) {
        this.inFavor = inFavor;
        this.against = against;
    }

    public int getInFavor() {
        return inFavor;
    }

    public int getAgainst() {
        return against;
    }

    public int getTotal() {
        return inFavor + against;
    }
}
