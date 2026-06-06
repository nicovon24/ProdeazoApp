"use client";

import { Info, Clock, CalendarDays, Trophy, Minus } from "lucide-react";
import { Header } from "../../../components/layout/Header";
import styles from "./rules.module.css";

export default function RulesPage() {
  return (
    <>
      <Header
        title="Reglas"
        subtitle="Todo lo que necesitás saber para competir en Prodeazo."
      />
      <main className={styles.main}>
        <div>
          <h2 className={styles.sectionHeader}>
            <Trophy className={styles.sectionIcon} />
            ¿Cómo se suman puntos?
          </h2>
          <p className={styles.sectionP}>
            Tus puntos se basan en qué tan acertadas son tus predicciones de resultado. Así es como funciona:
          </p>
        </div>

        <div className={styles.contentArea}>
          {/* Left Column - Scoring Rules */}
          <div className={styles.leftCol}>
            <div className={styles.pointList}>
              {/* Resultado Exacto */}
              <div className={`${styles.pointRow} ${styles.pointRowExact}`}>
                <div className={styles.pointRowIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 7a5 5 0 1 0 5 5" /><path d="M13 3.055a9 9 0 1 0 7.941 7.945" /><path d="M15 6v3h3l3 -3h-3v-3l-3 3" /><path d="M15 9l-3 3" /></svg>
                </div>
                <div className={styles.pointRowContent}>
                  <div className={styles.pointRowTitle}>Resultado Exacto</div>
                  <div className={styles.pointRowDesc}>Acertaste el marcador exacto del partido. Pusiste 2-2 y el partido salió 2-2.</div>
                </div>
                <div className={`${styles.pointRowValue} ${styles.pointRowValueExact}`}>+5 pts</div>
              </div>

              {/* Ganador Correcto */}
              <div className={`${styles.pointRow} ${styles.pointRowPartial}`}>
                <div className={styles.pointRowIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" /></svg>
                </div>
                <div className={styles.pointRowContent}>
                  <div className={styles.pointRowTitle}>Ganador Correcto</div>
                  <div className={styles.pointRowDesc}>Acertaste quién ganó el partido o si hubo empate, pero no pegaste el resultado exacto. Pusiste que ganaba Argentina 1-0, pero ganó 2-0.</div>
                </div>
                <div className={`${styles.pointRowValue} ${styles.pointRowValuePartial}`}>+3 pts</div>
              </div>

              {/* Sin aciertos */}
              <div className={`${styles.pointRow} ${styles.pointRowDanger}`}>
                <div className={styles.pointRowIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 12a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" /><path d="M3 21l18 -18" /></svg>
                </div>
                <div className={styles.pointRowContent}>
                  <div className={styles.pointRowTitle}>Sin aciertos</div>
                  <div className={styles.pointRowDesc}>No acertaste ni el resultado exacto ni el ganador del partido.</div>
                </div>
                <div className={`${styles.pointRowValue} ${styles.pointRowValueDanger}`}>0 pts</div>
              </div>
            </div>
          </div>

          {/* Right Column - Info Cards */}
          <div className={styles.rightCol}>
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <Clock className={styles.infoCardIcon} />
                ¿Hasta cuándo puedo predecir?
              </div>
              <div className={styles.infoCardBody}>
                Podés hacer o editar tus predicciones hasta 1 minuto antes del inicio de cada partido. Una vez que el partido comienza, ya no podrás realizar cambios.
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <CalendarDays className={styles.infoCardIcon} />
                Fechas y plazos
              </div>
              <div className={styles.infoCardBody}>
                La fase de grupos estará disponible desde el inicio del Mundial. Las predicciones deben realizarse fecha por fecha. A medida que avanza el torneo, se habilitan las siguientes fases.
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <Minus className={styles.infoCardIcon} />
                Desempates
              </div>
              <div className={styles.infoCardBody}>
                Si dos o más participantes terminan con la misma cantidad de puntos, se desempata por:
                <ol className={styles.infoCardList}>
                  <li>Mayor cantidad de resultados exactos.</li>
                  <li>Mayor cantidad de resultados correctos.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Info note pinned at bottom */}
        <div className={styles.infoNote}>
          <Info className={styles.infoNoteIcon} />
          Los puntos se actualizan automáticamente al finalizar cada partido.
        </div>
      </main>
    </>
  );
}
