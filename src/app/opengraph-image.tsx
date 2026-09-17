import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Pecatho — Descubra, conecte-se e escolha";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 84px",
          background: "#000309",
          color: "#FFFFFF",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 30,
            letterSpacing: 6,
            fontWeight: 700,
          }}
        >
          <span>PECATHO</span>
          <span style={{ color: "#E7C33F", fontSize: 42 }}>⬡</span>
        </div>
        <div
          style={{
            marginTop: 54,
            maxWidth: 980,
            fontSize: 70,
            lineHeight: 1.08,
            fontWeight: 800,
          }}
        >
          Descubra, conecte-se e escolha.
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 30,
            lineHeight: 1.3,
            color: "#D7D9E0",
            maxWidth: 900,
          }}
        >
          Perfis, experiências e Pecatho Fans em um único ecossistema.
        </div>
        <div
          style={{
            marginTop: 58,
            width: 110,
            height: 6,
            background: "#E7C33F",
            borderRadius: 999,
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
