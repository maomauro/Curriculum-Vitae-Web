using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class PublicCvVisitaRegistroService : IPublicCvVisitaRegistroService
{
    private readonly PortalCvDbContext _context;
    private readonly IRepository<AlertaVisita> _alertaRepo;

    public PublicCvVisitaRegistroService(PortalCvDbContext context, IRepository<AlertaVisita> alertaRepo)
    {
        _context = context;
        _alertaRepo = alertaRepo;
    }

    public async Task RegistrarVistaAsync(int curriculumId, CancellationToken ct = default)
    {
        var alerta = new AlertaVisita
        {
            CurriculumId = curriculumId,
            FechaVisita = DateTime.UtcNow,
            TipoVisita = "Vista",
            EsLeida = false,
            Titulo = "Nueva visita a tu CV"
        };
        await _alertaRepo.AddAsync(alerta, ct);

        var curriculum = await _context.Curriculums.FindAsync(new object[] { curriculumId }, ct);
        if (curriculum is not null)
        {
            curriculum.ContadorVisitas++;
            curriculum.FechaActualizacion = DateTime.UtcNow;
        }

        await EstadisticasPublicasUpdater.ActualizarAsync(_context, curriculumId, esContacto: false, ct);
        await _context.SaveChangesAsync(ct);
    }
}
