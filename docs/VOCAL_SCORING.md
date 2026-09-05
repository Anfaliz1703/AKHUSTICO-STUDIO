# Algoritmo de Evaluación Vocal y Detección de Cents — AKHUSTICO Studio

Este documento describe las bases matemáticas rigurosas utilizadas por AKHUSTICO Studio para calcular la desviación en cents, clasificar la afinación y generar el resumen de práctica vocal sin inferencias arbitrarias.

---

## 1. Cálculo de Desviación en Cents

La diferencia en semitonos microscópicos (cents) entre la frecuencia del usuario ($f_{\text{user}}$) y la frecuencia melódica objetivo ($f_{\text{target}}$) se define matemáticamente por:

$$\Delta_{\text{cents}} = 1200 \times \log_2\left(\frac{f_{\text{user}}}{f_{\text{target}}}\right)$$

### Consideraciones:
- Solo se calculan cents cuando ambos valores son positivos y están clasificados como vocalizados (`voiced = true`) con una confianza de detección superior a un umbral mínimo (ej. $\text{confidence} \ge 0.80$).
- Si el usuario canta exactamente en la nota objetivo, $\Delta_{\text{cents}} = 0$.
- Si el usuario está medio semitono arriba (cuarto de tono alto), $\Delta_{\text{cents}} = +50$.

---

## 2. Clasificación de Afinación por Tolerancia

Por defecto, se aplican los siguientes rangos configurables en los ajustes del usuario:

| Rango de Desviación ($|\Delta_{\text{cents}}|$) | Calificación | Color Visual / Indicador |
|---|---|---|
| **0 – 15 cents** | Excelente | Verde esmeralda (`#10b981`) |
| **16 – 25 cents** | Muy afinado | Cian brillante (`#06b6d4`) |
| **26 – 40 cents** | Cerca | Amarillo ámbar (`#f59e0b`) |
| **41 – 50 cents** | Revisar | Naranja advertencia (`#f97316`) |
| **> 50 cents** | Fuera de nota | Rojo suave (`#ef4444`) |

---

## 3. Métricas de Sesión de Práctica

Cada ensayo genera cuatro métricas objetivas basadas en el conjunto de frames analizados:

### 1. Puntuación de Afinación (`pitchScore`)
Mide la precisión de tono en los momentos donde la voz coincidió en tiempo con una nota melódica:
$$\text{pitchScore} = 100 \times \frac{1}{N} \sum_{i=1}^{N} \max\left(0, 1 - \frac{|\Delta_{\text{cents}, i}|}{100}\right)$$

### 2. Puntuación de Ritmo (`rhythmScore`)
Mide la sincronización temporal en los ataques y finales de nota: compara la diferencia en milisegundos entre el inicio de la vocalización del usuario y el onset de la nota objetivo. Desviaciones menores a $\pm 80\text{ ms}$ reciben puntuación máxima.

### 3. Puntuación de Estabilidad (`stabilityScore`)
Evalúa la fluctuación no intencionada del tono durante notas sostenidas (varianza del F0 tras eliminar vibrato natural de $\approx 5\text{ Hz}$).

### 4. Puntuación General (`overallScore`)
Ponderación balanceada:
$$\text{overallScore} = 0.50 \times \text{pitchScore} + 0.25 \times \text{rhythmScore} + 0.25 \times \text{stabilityScore}$$

---

## 4. Detección de Patrones de Dificultad
El sistema analiza segmentos continuos de error y clasifica acústicamente el problema:
- **Entrada baja / alta:** El primer 25% de la nota presenta $\Delta_{\text{cents}} < -30$ (o $> +30$), corrigiéndose después.
- **Caída de nota (`flatting out`):** La nota inicia afinada pero desciende progresivamente al sostenerla por pérdida de soporte aéreo.
- **Inestabilidad:** Alta dispersión en cents sin llegar a estabilizar un tono fijo.
- **Entrada tardía:** El usuario comienza a cantar más de 120ms después del target.
