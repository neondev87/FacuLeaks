"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/chat/EmptyStateBg.js — fondo decorativo del chat vacío
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja el fondo del recuadro derecho cuando NO hay ninguna
// conversación abierta. Tres capas, de atrás hacia adelante:
//   1. `.bible-layer` — muchas columnas de texto serif chiquito, tratamiento
//      "red-letter": Reina-Valera 1909 (dominio público) con las palabras
//      de Cristo en el rojo del tema (HOLO_THEME.marker). Marca de agua muy
//      tenue, llena todo el alto repitiendo los mismos versículos.
//   2. `.empty-fig-l` / `.empty-fig-r` — las dos imágenes ancladas al pie
//      (art/chat-fig-izq.png = manos, art/chat-fig-der.png = cráneo). Son PNG
//      RGBA ya procesados: teñidos del rojo del tema (HOLO_THEME.marker, con
//      los brillos hacia un cálido) y con el alpha sacado de la luminancia —
//      el negro del original ya viene transparente, así que NO hace falta
//      blend mode (eso era lo que dibujaba un recuadro gris de fondo).
//      Acomodo "anchas simétricas": grandes, altas, un poco sangradas hacia
//      afuera; la derecha va algo más grande y opaca. Se funden hacia arriba
//      con un `mask-image`.
// El componente es puramente decorativo (`aria-hidden`, `pointer-events`
// desactivados en el CSS): NO tapa ni compite con el buscador, que va por
// delante con z-index más alto (ver `.empty-search` en chatStyles.js).
//
// CON QUÉ SE CONECTA: lo monta app/chat/page.js dentro del recuadro vacío
// de "nueva conversación". El CSS de las tres capas está en
// app/chat/chatStyles.js (`.empty-bg`, `.bible-layer`, `.empty-fig*`).
// ════════════════════════════════════════════════════════════════════════

// Cada versículo es una lista de tramos: `{ text, rojo? }`. `rojo:true`
// marca las palabras de Cristo (se pintan con HOLO_THEME.marker).
const VERSICULOS = [
  [{ text: "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios. En él estaba la vida, y la vida era la luz de los hombres. Y la luz en las tinieblas resplandece; mas las tinieblas no la comprendieron." }],
  [
    { text: "Otra vez les habló Jesús, diciendo: " },
    { text: "Yo soy la luz del mundo: el que me sigue, no andará en tinieblas, mas tendrá la lumbre de la vida.", rojo: true },
  ],
  [
    { text: "Y abriendo su boca, les enseñaba, diciendo: " },
    { text: "Bienaventurados los pobres en espíritu: porque de ellos es el reino de los cielos. Bienaventurados los que lloran: porque ellos recibirán consolación. Bienaventurados los mansos: porque ellos recibirán la tierra por heredad.", rojo: true },
  ],
  [{ text: "Vosotros sois la luz del mundo: una ciudad asentada sobre un monte no se puede esconder. Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras.", rojo: true }],
  [{ text: "Jehová es mi pastor; nada me faltará. Aunque ande en valle de sombra de muerte, no temeré mal alguno; porque tú estarás conmigo: tu vara y tu cayado me infundirán aliento." }],
  [
    { text: "Y dijo Jesús: " },
    { text: "Venid á mí todos los que estáis trabajados y cargados, que yo os haré descansar. Llevad mi yugo sobre vosotros, y aprended de mí, que soy manso y humilde de corazón; y hallaréis descanso para vuestras almas.", rojo: true },
  ],
  [{ text: "Vanidad de vanidades, dijo el Predicador; todo vanidad. Generación va, y generación viene: mas la tierra siempre permanece. Los ríos todos van á la mar, y la mar no se hinche." }],
  [{ text: "Toda carne es hierba, y toda su gloria como flor del campo. Sécase la hierba, cáese la flor: mas la palabra del Dios nuestro permanece para siempre." }],
];

// Repetido para que el texto llene todo el alto disponible sin huecos.
const REPETICIONES = 4;

export default function EmptyStateBg() {
  const parrafos = [];
  for (let r = 0; r < REPETICIONES; r++) parrafos.push(...VERSICULOS);

  return (
    <div className="empty-bg" aria-hidden="true">
      <div className="bible-layer">
        {parrafos.map((tramos, i) => (
          <p key={i}>
            {tramos.map((s, j) => (
              <span key={j} className={s.rojo ? "rl-rojo" : undefined}>{s.text}</span>
            ))}
          </p>
        ))}
      </div>
      <div className="empty-fig empty-fig-l" />
      <div className="empty-fig empty-fig-r" />
    </div>
  );
}
