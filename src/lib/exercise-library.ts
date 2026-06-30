import type { MuscleId } from "@/store/marcola";
import supinoReto from "@/assets/library/supino-reto.jpg";
import supinoInclinado from "@/assets/library/supino-inclinado.jpg";
import desenvolvimento from "@/assets/library/desenvolvimento.jpg";
import elevacaoLateral from "@/assets/library/elevacao-lateral.jpg";
import agachamento from "@/assets/library/agachamento.jpg";
import legPress from "@/assets/library/leg-press.jpg";
import stiff from "@/assets/library/stiff.jpg";
import barraFixa from "@/assets/library/barra-fixa.jpg";
import remadaCurvada from "@/assets/library/remada-curvada.jpg";
import roscaDireta from "@/assets/library/rosca-direta.jpg";
import tricepsCorda from "@/assets/library/triceps-corda.jpg";
import panturrilha from "@/assets/library/panturrilha.jpg";

export type Equipment = "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";

export interface LibraryExercise {
  id: string;
  name: string;
  primary: MuscleId;
  secondary: MuscleId[];
  equipment: Equipment;
  difficulty: 1 | 2 | 3;
  defaultRestSeconds: number;
  defaultTempo: string;
  instructions: string[];
  image: string;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  {
    id: "lib-supino-reto",
    name: "Supino Reto Barra",
    primary: "chest",
    secondary: ["shoulders", "triceps"],
    equipment: "barbell",
    difficulty: 3,
    defaultRestSeconds: 120,
    defaultTempo: "3-1-1-0",
    instructions: [
      "Deite no banco com escápulas retraídas e pés firmes no chão.",
      "Pegada um pouco mais larga que os ombros, polegares envolvendo a barra.",
      "Desça a barra controlando até a linha do mamilo, encostando levemente.",
      "Empurre explosivamente até quase travar o cotovelo, sem perder o arco lombar.",
    ],
    image: supinoReto,
  },
  {
    id: "lib-supino-inclinado-halter",
    name: "Supino Inclinado Halter",
    primary: "chest",
    secondary: ["shoulders"],
    equipment: "dumbbell",
    difficulty: 2,
    defaultRestSeconds: 90,
    defaultTempo: "3-1-1-0",
    instructions: [
      "Banco entre 30-45°, halteres na altura do peito com cotovelos a ~45°.",
      "Pressione os halteres em arco até quase se tocarem no topo.",
      "Desça lentamente buscando o máximo de alongamento sem perder controle.",
    ],
    image: supinoInclinado,
  },
  {
    id: "lib-desenvolvimento",
    name: "Desenvolvimento Militar",
    primary: "shoulders",
    secondary: ["triceps", "core"],
    equipment: "barbell",
    difficulty: 3,
    defaultRestSeconds: 120,
    defaultTempo: "2-1-1-0",
    instructions: [
      "Em pé, pés na largura dos ombros, glúteo e core contraídos.",
      "Barra na altura das clavículas, cotovelos ligeiramente à frente.",
      "Empurre acima da cabeça, deslocando a cabeça para frente no topo.",
      "Desça controlado sem perder a tensão na escápula.",
    ],
    image: desenvolvimento,
  },
  {
    id: "lib-elevacao-lateral",
    name: "Elevação Lateral",
    primary: "shoulders",
    secondary: [],
    equipment: "dumbbell",
    difficulty: 1,
    defaultRestSeconds: 60,
    defaultTempo: "2-0-2-1",
    instructions: [
      "Halteres ao lado do corpo, leve flexão de cotovelo (~10°).",
      "Eleve os braços para os lados liderando com o cotovelo, até a altura do ombro.",
      "Desça controlando 2-3 segundos, sem balançar o tronco.",
    ],
    image: elevacaoLateral,
  },
  {
    id: "lib-agachamento",
    name: "Agachamento Livre",
    primary: "quads",
    secondary: ["glutes", "core", "lower-back"],
    equipment: "barbell",
    difficulty: 3,
    defaultRestSeconds: 180,
    defaultTempo: "3-1-1-0",
    instructions: [
      "Barra apoiada no trapézio (low/high bar), pés na largura dos ombros.",
      "Inicie o movimento empurrando o quadril para trás e flexionando joelhos.",
      "Desça até pelo menos a paralela, joelhos alinhados com os pés.",
      "Suba empurrando o chão, peito alto, sem flexionar o tronco prematuramente.",
    ],
    image: agachamento,
  },
  {
    id: "lib-leg-press",
    name: "Leg Press 45°",
    primary: "quads",
    secondary: ["glutes", "hamstrings"],
    equipment: "machine",
    difficulty: 2,
    defaultRestSeconds: 120,
    defaultTempo: "2-1-2-0",
    instructions: [
      "Pés afastados na plataforma, na largura dos ombros.",
      "Desça controlando até quase encostar as coxas no abdômen.",
      "Empurre sem travar os joelhos no topo.",
    ],
    image: legPress,
  },
  {
    id: "lib-stiff",
    name: "Stiff Barra",
    primary: "hamstrings",
    secondary: ["glutes", "lower-back"],
    equipment: "barbell",
    difficulty: 3,
    defaultRestSeconds: 120,
    defaultTempo: "3-1-1-0",
    instructions: [
      "Pés na largura do quadril, leve flexão de joelhos travada.",
      "Empurre o quadril para trás, mantendo a barra próxima às pernas.",
      "Desça até sentir o alongamento do posterior, lombar neutra.",
      "Retorne contraindo glúteo e posterior, sem hiperextender no topo.",
    ],
    image: stiff,
  },
  {
    id: "lib-barra-fixa",
    name: "Barra Fixa Pronada",
    primary: "lats",
    secondary: ["biceps", "traps"],
    equipment: "bodyweight",
    difficulty: 3,
    defaultRestSeconds: 120,
    defaultTempo: "2-0-3-1",
    instructions: [
      "Pegada pronada, pouco mais larga que os ombros.",
      "Comece com escápulas ativas, puxe o peito em direção à barra.",
      "Desça controlando até alongamento total dos dorsais.",
    ],
    image: barraFixa,
  },
  {
    id: "lib-remada-curvada",
    name: "Remada Curvada Barra",
    primary: "lats",
    secondary: ["traps", "biceps", "lower-back"],
    equipment: "barbell",
    difficulty: 3,
    defaultRestSeconds: 120,
    defaultTempo: "2-1-2-0",
    instructions: [
      "Tronco ~45°, joelhos levemente flexionados, lombar neutra.",
      "Puxe a barra em direção ao abdômen baixo, cotovelos próximos.",
      "Aperte as escápulas no topo, desça controlando.",
    ],
    image: remadaCurvada,
  },
  {
    id: "lib-rosca-direta",
    name: "Rosca Direta Barra",
    primary: "biceps",
    secondary: ["forearms"],
    equipment: "barbell",
    difficulty: 1,
    defaultRestSeconds: 75,
    defaultTempo: "2-1-2-0",
    instructions: [
      "Em pé, cotovelos colados ao tronco, pegada supinada na largura dos ombros.",
      "Curl até o pico de contração, sem deslocar o cotovelo.",
      "Desça controlando até alongamento total.",
    ],
    image: roscaDireta,
  },
  {
    id: "lib-triceps-corda",
    name: "Tríceps Corda Polia",
    primary: "triceps",
    secondary: [],
    equipment: "cable",
    difficulty: 1,
    defaultRestSeconds: 60,
    defaultTempo: "2-1-2-0",
    instructions: [
      "Cotovelos pinados ao tronco, corda à frente.",
      "Empurre para baixo abrindo a corda ao final do movimento.",
      "Suba controlando até 90° de cotovelo.",
    ],
    image: tricepsCorda,
  },
  {
    id: "lib-panturrilha",
    name: "Panturrilha em Pé",
    primary: "calves",
    secondary: [],
    equipment: "machine",
    difficulty: 1,
    defaultRestSeconds: 60,
    defaultTempo: "2-1-3-1",
    instructions: [
      "Ponta dos pés na plataforma, calcanhar livre.",
      "Eleve na máxima amplitude, segurando o pico 1s.",
      "Desça lentamente buscando alongamento máximo.",
    ],
    image: panturrilha,
  },
];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "Barra",
  dumbbell: "Halter",
  cable: "Polia",
  machine: "Máquina",
  bodyweight: "Peso Corporal",
};

export const MUSCLE_LABEL: Record<MuscleId, string> = {
  chest: "Peito",
  shoulders: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebraço",
  core: "Core",
  obliques: "Oblíquos",
  quads: "Quadríceps",
  hamstrings: "Posterior",
  glutes: "Glúteos",
  calves: "Panturrilha",
  lats: "Latíssimo",
  traps: "Trapézio",
  "lower-back": "Lombar",
  neck: "Pescoço",
};

export function getLibraryExercise(id: string): LibraryExercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id);
}
