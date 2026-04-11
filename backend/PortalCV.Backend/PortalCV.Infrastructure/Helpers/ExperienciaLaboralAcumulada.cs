namespace PortalCV.Infrastructure.Helpers;

/// <summary>Suma de meses de experiencia laboral (única regla compartida: API pública, editor).</summary>
public static class ExperienciaLaboralAcumulada
{
    /// <summary>Año mínimo aceptado en fechas de trayectoria (validación y cálculo).</summary>
    public const int AnoMinimoTrayectoria = 1950;

    private const int MesesMaximosPorPuesto = 600;

    public static int CalcularMeses(IEnumerable<(DateOnly? FechaInicio, DateOnly? FechaFin, bool EsActual)> filas)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var suma = 0;
        foreach (var exp in filas)
        {
            if (exp.FechaInicio is null)
                continue;

            var start = exp.FechaInicio.Value;
            if (start.Year < AnoMinimoTrayectoria || start > today)
                continue;

            var end = exp.EsActual
                ? today
                : (exp.FechaFin ?? today);

            if (end > today)
                end = today;
            if (end < start || end.Year < AnoMinimoTrayectoria)
                continue;

            var meses = DiffInMonthsInclusive(start, end);
            if (meses > MesesMaximosPorPuesto)
                meses = MesesMaximosPorPuesto;

            suma += meses;
        }

        return suma;
    }

    private static int DiffInMonthsInclusive(DateOnly start, DateOnly end)
    {
        var total = (end.Year - start.Year) * 12 + (end.Month - start.Month) + 1;
        return Math.Max(0, total);
    }
}
