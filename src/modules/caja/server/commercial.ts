type TarifaSnapshotLike = {
  tipoEstadiaAplicada?: 'hora' | 'dia' | 'libre';
  cantidadAplicada?: number;
};

type TicketLike = {
  tipoEstadia?: 'hora' | 'dia' | 'libre';
  cantidadHoras?: number;
  cantidadDias?: number;
  tarifa?: TarifaSnapshotLike;
};

export function describeCommercialUnit(ticket: TicketLike) {
  const tipo = ticket.tarifa?.tipoEstadiaAplicada ?? ticket.tipoEstadia ?? 'libre';
  const cantidadAplicada = Number(
    ticket.tarifa?.cantidadAplicada ??
      (tipo === 'hora' ? ticket.cantidadHoras : tipo === 'dia' ? ticket.cantidadDias : 0) ??
      0,
  );

  if (tipo === 'hora') {
    const cantidad = cantidadAplicada > 0 ? cantidadAplicada : 1;
    return `Estadía x ${cantidad} hora${cantidad === 1 ? '' : 's'}`;
  }

  if (tipo === 'dia') {
    const cantidad = cantidadAplicada > 0 ? cantidadAplicada : 1;
    return `Estadía x ${cantidad} día${cantidad === 1 ? '' : 's'}`;
  }

  return 'Tarifa libre / paga tiempo transcurrido';
}
