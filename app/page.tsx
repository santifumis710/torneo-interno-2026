import PublicView from "./PublicView";
import { getPublicData, type PublicData } from "@/lib/queries";

export const dynamic = "force-dynamic";

const EMPTY: PublicData = {
  settings: {
    tournament_name: "Torneo Interno 2026",
    subtitle: "UTN · Facultad Regional Santa Fe",
    logo_url: null,
    points_win: 3,
    points_draw: 1,
  },
  zones: [],
  ties: [],
  teamsById: {},
  playersByTeam: {},
};

export default async function Home() {
  let data = EMPTY;
  try {
    data = await getPublicData();
  } catch (err) {
    // La base todavía no está lista (tablas no creadas o sin conexión): mostramos estados vacíos.
    console.error("No se pudo leer la base:", err);
  }
  return <PublicView data={data} />;
}
