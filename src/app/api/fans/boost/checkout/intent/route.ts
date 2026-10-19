import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "O impulsionamento do Pecatho Fans é oferecido por meio de presentes enviados por fãs. Abra o perfil público do criador e use “Enviar presente”.",
      code: "BOOST_REQUIRES_FAN_GIFT",
    },
    { status: 410 },
  );
}
