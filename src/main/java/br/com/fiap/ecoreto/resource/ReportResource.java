package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.service.ReportService;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

/** Indicadores de impacto (README, seção 1.6). Dados agregados, sem votos individuais. */
@Path("reports")
@Produces(MediaType.APPLICATION_JSON)
public class ReportResource {

    private final ReportService service = new ReportService();

    /** Propostas ativas com mais apoio. ?limit=10 (1 a 50). */
    @GET
    @Path("ranking")
    public List<Map<String, Object>> ranking(@QueryParam("limit") Integer limit) {
        return service.ranking(limit);
    }

    @GET
    @Path("votes-by-region")
    public List<Map<String, Object>> votesByRegion() {
        return service.votesByRegion();
    }

    @GET
    @Path("by-category")
    public List<Map<String, Object>> byCategory() {
        return service.byCategory();
    }

    @GET
    @Path("avg-time")
    public Map<String, Object> averageTimes() {
        return service.averageTimes();
    }

    /** Propostas paradas há mais de ?days= dias (padrão: stale_after_days). */
    @GET
    @Path("stale")
    public List<Map<String, Object>> stale(@QueryParam("days") Integer days) {
        return service.stale(days);
    }

    @GET
    @Path("participation")
    public Map<String, Object> participation() {
        return service.participation();
    }
}
