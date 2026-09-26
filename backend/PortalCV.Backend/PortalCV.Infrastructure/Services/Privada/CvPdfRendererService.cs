using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PortalCV.Infrastructure.Services;

public class CvPdfRendererService : ICvPdfRendererService
{
    static CvPdfRendererService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Renderar(PersonalesDto personales, PerfilDto perfil, ContenidoCvGeneradoDto contenido)
    {
        var nombreCompleto = string.Join(' ', new[]
            {
                personales.PrimerNombre, personales.SegundoNombre,
                personales.PrimerApellido, personales.SegundoApellido,
            }.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (string.IsNullOrWhiteSpace(nombreCompleto)) nombreCompleto = "Candidato";

        var contacto = string.Join("   ·   ", new[]
            {
                personales.Email,
                personales.Celular,
                CiudadPais(personales.Ciudad, personales.Pais),
            }.Where(s => !string.IsNullOrWhiteSpace(s)));

        var documento = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text(nombreCompleto).FontSize(20).Bold();
                    if (!string.IsNullOrWhiteSpace(perfil.NombrePerfil))
                        col.Item().Text(perfil.NombrePerfil).FontSize(12).FontColor(Colors.Blue.Darken2);
                    if (!string.IsNullOrWhiteSpace(contacto))
                        col.Item().PaddingTop(4).Text(contacto).FontSize(9).FontColor(Colors.Grey.Darken1);
                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().PaddingTop(12).Column(col =>
                {
                    col.Spacing(12);

                    if (!string.IsNullOrWhiteSpace(perfil.DescripcionPerfil))
                    {
                        SeccionTitulo(col, "Perfil Profesional");
                        col.Item().Text(perfil.DescripcionPerfil).Justify();

                        var meta = new List<string>();
                        if (perfil.ExperienciaPerfilAnios != null)
                            meta.Add($"Experiencia: {perfil.ExperienciaPerfilAnios} años");
                        var aspiracion = AspiracionTexto(perfil);
                        if (aspiracion != null) meta.Add(aspiracion);
                        if (meta.Count > 0)
                            col.Item().Text(string.Join("   ·   ", meta)).FontSize(9).FontColor(Colors.Grey.Darken1);
                    }

                    if (contenido.Experiencia.Count > 0)
                    {
                        SeccionTitulo(col, "Experiencia Laboral");
                        foreach (var exp in contenido.Experiencia)
                        {
                            if (!string.IsNullOrWhiteSpace(exp.Cabecera))
                                col.Item().Text(exp.Cabecera).Bold();
                            foreach (var funcion in exp.Funciones)
                                Vineta(col, funcion);
                        }
                    }

                    if (contenido.Educacion.Count > 0)
                    {
                        SeccionTitulo(col, "Formación");
                        foreach (var linea in contenido.Educacion)
                            Vineta(col, linea);
                    }

                    if (contenido.Proyectos.Count > 0)
                    {
                        SeccionTitulo(col, "Proyectos Destacados");
                        foreach (var linea in contenido.Proyectos)
                            Vineta(col, linea);
                    }

                    if (contenido.Habilidades.Count > 0)
                    {
                        SeccionTitulo(col, "Habilidades");
                        col.Item().Text(string.Join("  •  ", contenido.Habilidades.Select(h => h.Nombre)));
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        return documento.GeneratePdf();
    }

    private static void SeccionTitulo(QuestPDF.Fluent.ColumnDescriptor col, string titulo)
    {
        col.Item().PaddingBottom(2).BorderBottom(1).BorderColor(Colors.Grey.Lighten1)
            .Text(titulo.ToUpperInvariant()).FontSize(11).Bold().FontColor(Colors.Blue.Darken2);
    }

    private static void Vineta(QuestPDF.Fluent.ColumnDescriptor col, string texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return;
        col.Item().Row(row =>
        {
            row.ConstantItem(10).Text("•");
            row.RelativeItem().Text(texto);
        });
    }

    private static string? CiudadPais(string? ciudad, string? pais)
    {
        var c = ciudad?.Trim();
        var p = pais?.Trim();
        if (string.IsNullOrEmpty(c) && string.IsNullOrEmpty(p)) return null;
        if (!string.IsNullOrEmpty(c) && !string.IsNullOrEmpty(p)) return $"{c}, {p}";
        return c ?? p;
    }

    private static string? AspiracionTexto(PerfilDto perfil)
    {
        if (perfil.AspiracionSalarialPesos is null && perfil.AspiracionSalarialDolares is null) return null;
        var partes = new List<string>();
        if (perfil.AspiracionSalarialPesos is not null)
            partes.Add($"${perfil.AspiracionSalarialPesos:N0} COP");
        if (perfil.AspiracionSalarialDolares is not null)
            partes.Add($"${perfil.AspiracionSalarialDolares:N0} USD");
        return "Aspiración: " + string.Join(" / ", partes);
    }
}
