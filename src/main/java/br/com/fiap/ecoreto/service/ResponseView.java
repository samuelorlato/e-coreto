package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.model.OfficialResponse;

/** Resposta oficial + nome da autoridade que publicou. */
public class ResponseView {

    private final OfficialResponse response;
    private final String authorName;

    ResponseView(OfficialResponse response, String authorName) {
        this.response = response;
        this.authorName = authorName;
    }

    public OfficialResponse getResponse() {
        return response;
    }

    public String getAuthorName() {
        return authorName;
    }
}
