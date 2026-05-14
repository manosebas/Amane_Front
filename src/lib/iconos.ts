const MAPEO: Array<[RegExp, string]> = [
  // Deportes con pelota
  [/\b(futbol|soccer|balompie|futbolito)\b/, '⚽'],
  [/\b(basquet|basquetbol|basketball|baloncesto|basket)\b/, '🏀'],
  [/\b(beisbol|baseball|softbol|softball)\b/, '⚾'],
  [/\b(voley|voleibol|volley|volleyball)\b/, '🏐'],
  [/\b(tenis|tennis)\b/, '🎾'],
  [/\b(rugby)\b/, '🏉'],
  [/\b(futbol americano|americano|nfl)\b/, '🏈'],
  [/\b(golf)\b/, '⛳'],
  [/\b(ping[- ]?pong|tenis de mesa|tenis mesa)\b/, '🏓'],
  [/\b(badminton)\b/, '🏸'],
  [/\b(hockey)\b/, '🏑'],
  [/\b(cricket)\b/, '🏏'],
  [/\b(lacrosse)\b/, '🥍'],
  // Acuáticos
  [/\b(natacion|nadar|swim|swimming)\b/, '🏊'],
  [/\b(surf|surfing)\b/, '🏄'],
  [/\b(remo|kayak|canoa|piraguismo)\b/, '🚣'],
  [/\b(waterpolo|polo acuatico)\b/, '🤽'],
  [/\b(buceo|snorkel|snorkeling)\b/, '🤿'],
  [/\b(vela|navegacion|velerismo)\b/, '⛵'],
  // Combate / artes marciales
  [/\b(boxeo|boxing|box)\b/, '🥊'],
  [/\b(karate|judo|taekwondo|kung[- ]?fu|jiu[- ]?jitsu|aikido|artes marciales|martial)\b/, '🥋'],
  [/\b(esgrima|fencing)\b/, '🤺'],
  [/\b(lucha|wrestling)\b/, '🤼'],
  // Atletismo / fitness
  [/\b(atletismo|correr|running|carrera|maraton|sprint|trote|trail)\b/, '🏃'],
  [/\b(ciclismo|bici|bicicleta|biking|mtb|spinning)\b/, '🚴'],
  [/\b(gimnasia|gimnastica|gymnastic)\b/, '🤸'],
  [/\b(yoga|pilates|meditacion|mindfulness)\b/, '🧘'],
  [/\b(crossfit|pesas|gym|gimnasio|musculacion|fitness|halterofilia|levantamiento)\b/, '🏋️'],
  [/\b(escalada|climbing|escalar|rocodromo)\b/, '🧗'],
  // Ecuestre / invierno / aire libre
  [/\b(equitacion|hipica|caballo|caballos)\b/, '🏇'],
  [/\b(esqui|ski|snowboard)\b/, '⛷️'],
  [/\b(patinaje|patines|skating)\b/, '⛸️'],
  [/\b(skate|skateboard|patineta|monopatin)\b/, '🛹'],
  [/\b(arco|tiro con arco|archery)\b/, '🏹'],
  [/\b(pesca|fishing)\b/, '🎣'],
  [/\b(camping|campismo|excursionismo|senderismo|hiking|trekking|montanismo)\b/, '🏕️'],
  // Música
  [/\b(piano|teclado)\b/, '🎹'],
  [/\b(guitarra|guitar|bajo)\b/, '🎸'],
  [/\b(violin|viola|cello|chelo|contrabajo|cuerdas)\b/, '🎻'],
  [/\b(bateria|tambor|tambores|drums|percusion)\b/, '🥁'],
  [/\b(saxo|saxofon|trompeta|trombon|tuba|metales|viento)\b/, '🎺'],
  [/\b(flauta)\b/, '🪈'],
  [/\b(canto|coro|coral|cantar|vocal|singing)\b/, '🎤'],
  [/\b(musica|orquesta|banda|conjunto)\b/, '🎵'],
  // Arte / escena
  [/\b(danza|baile|ballet|dance|hip[- ]?hop)\b/, '💃'],
  [/\b(teatro|drama|actuacion|theater)\b/, '🎭'],
  [/\b(cine|filmmaking|cinema|audiovisual)\b/, '🎬'],
  [/\b(fotografia|foto|photo|photography)\b/, '📷'],
  [/\b(pintura|pintar|paint|acuarela|oleo)\b/, '🖌️'],
  [/\b(dibujo|dibujar|sketch|drawing|comic|manga|ilustracion)\b/, '✏️'],
  [/\b(escultura|ceramica|alfareria|barro|arcilla)\b/, '🏺'],
  // Mente / ciencia / tech
  [/\b(ajedrez|chess)\b/, '♟️'],
  [/\b(robotica|robot)\b/, '🤖'],
  [/\b(programacion|coding|code|computacion|informatica|software|desarrollo web)\b/, '💻'],
  [/\b(ciencia|laboratorio|quimica|fisica|biologia)\b/, '🔬'],
  [/\b(matematica|matematicas|math|algebra|geometria|calculo)\b/, '🧮'],
  [/\b(astronomia|espacio|telescopio)\b/, '🔭'],
  [/\b(lectura|leer|libro|libros|literatura)\b/, '📚'],
  [/\b(escritura|escribir|redaccion|poesia|cuento|periodismo)\b/, '📝'],
  [/\b(idioma|idiomas|ingles|frances|aleman|portugues|italiano|chino|japones|kichwa|quichua|espanol|debate|oratoria)\b/, '🗣️'],
  // Hobbies / varios
  [/\b(cocina|gastronomia|reposteria|panaderia|chef|bakery)\b/, '🍳'],
  [/\b(jardineria|huerta|huerto|botanica|plantas)\b/, '🌱'],
  [/\b(manualidades|crafts|origami|tejido|tejer|bordado|costura)\b/, '🧶'],
  [/\b(juego|juegos|gaming|videojuegos|esports)\b/, '🎮'],
  [/\b(magia|mago)\b/, '🎩'],
  // Categorías genéricas (al final, menos específicas)
  [/\b(deporte|deportes|sport|sports)\b/, '🏅'],
  [/\b(arte|artes|cultura|cultural)\b/, '🎨'],
  [/\b(academic|academica|academico|estudio|educacion|escolar)\b/, '🎓'],
  [/\b(recreacion|recreativo|club)\b/, '🎉'],
]

const FALLBACK = '✨'

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function iconoDesdeNombre(nombre: string): string {
  const n = normalizar(nombre)
  for (const [re, icon] of MAPEO) {
    if (re.test(n)) return icon
  }
  return FALLBACK
}
