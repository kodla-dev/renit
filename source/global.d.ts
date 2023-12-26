/**
  Type that checks if type `R` extends type `N`, and returns type `R` if true,
  otherwise returns `never`.
  
  @tr `R` tipi, `N` tipine türemişse `R` tipini, aksi takdirde `never` tipini
  döndüren bir tür.

  @template T - The type to be checked.
  @tr Kontrol edilecek tip.
  
  @template N - The type to check against.
  @tr İçerip içermediği kontrol edilen tip.
*/
type Include<R, N> = R extends N ? R : never;
