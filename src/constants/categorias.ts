export const categoriasArray = ['Automóvil', 'Camioneta', 'Bicicleta', 'Motocicleta', 'Otros'] as const;
export type Categoria = typeof categoriasArray[number];
