import { ITicket } from "@/models/Ticket";

export const calcularTarifa = (ticket: ITicket): number => {
  if (!ticket.ingreso) return 0;

  const ingreso = new Date(ticket.ingreso);
  const salida = ticket.salida ? new Date(ticket.salida) : new Date();
  const minutos = Math.ceil((salida.getTime() - ingreso.getTime()) / 60000);

  let total = 0;

  switch (ticket.tarifa.tipo) {
    case "hora":
      total = Math.ceil(minutos / 60) * ticket.tarifa.valor;
      break;
    case "fraccion":
      if (!ticket.tarifa.fraccionMinutos) return 0;
      const fracciones = Math.ceil(minutos / ticket.tarifa.fraccionMinutos);
      total =
        fracciones *
        (ticket.tarifa.valor / (60 / ticket.tarifa.fraccionMinutos));
      break;
    case "dia":
      total = Math.ceil(minutos / (60 * 24)) * ticket.tarifa.valor;
      break;
    case "estadia":
      total = ticket.tarifa.valor;
      break;
  }

  return total;
};
