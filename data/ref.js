/* Tabla de referencia que acompaña a los 3 módulos.
   Solo contiene patrones antropométricos y fórmulas: los criterios de los programas (PNAC, PACAM, PSCV, etc.) son parte de lo evaluado y no se entregan. */
window.APS_REF = '' +
'<p class="note">Úsala como lo harías con el cuaderno de salud o las gráficas en el box: te entrega los puntos de corte, no el diagnóstico. Los criterios de ingreso a programas no están aquí porque se evalúan.</p>' +

'<h4>Fórmulas</h4>' +
'<p><b>IMC</b> = peso (kg) / talla² (m). · <b>% de lactancia materna diaria</b> = (n.º de veces al día que recibe pecho × 100) / n.º de veces al día que es alimentado. LME 100 %; LMP 50–90 %; FP 10–49,9 %; FE &lt;10 %.</p>' +
'<p><b>Edad corregida (semanas)</b> = edad cronológica (semanas) − (40 − semanas de gestación al nacer). · <b>Talla diana</b>: niños = [(talla padre + talla madre) / 2] + 6,5 cm; niñas = [(talla padre + talla madre) / 2] − 6,5 cm.</p>' +
'<p><b>Tarros a entregar</b> = kg prescritos al mes / contenido del tarro; siempre se aproxima al número entero superior.</p>' +

'<h4>Calificación nutricional infantil (MINSAL 2018, OMS 2006/2007)</h4>' +
'<div class="tbl"><table><thead><tr><th>Calificación</th><th>&lt;1 año</th><th>1 año a 5 años 29 días</th><th>5 años 1 mes a 19 años</th></tr></thead><tbody>' +
'<tr><td>Desnutrición</td><td>P/E ≤ −2 DE</td><td>P/T ≤ −2 DE</td><td>IMC/E ≤ −2 DE</td></tr>' +
'<tr><td>Riesgo de desnutrir</td><td>P/E ≤ −1 y &gt; −2 DE</td><td>P/T ≤ −1 y &gt; −2 DE</td><td>IMC/E ≤ −1 y &gt; −2 DE</td></tr>' +
'<tr><td>Normal o eutrófico</td><td>P/E &gt; −1 y &lt; +1 DE</td><td>P/T &gt; −1 y &lt; +1 DE</td><td>IMC/E &gt; −1 y &lt; +1 DE</td></tr>' +
'<tr><td>Sobrepeso</td><td>P/T ≥ +1 y &lt; +2 DE</td><td>P/T ≥ +1 y &lt; +2 DE</td><td>IMC/E ≥ +1 y &lt; +2 DE</td></tr>' +
'<tr><td>Obesidad</td><td>P/T ≥ +2 DE</td><td>P/T ≥ +2 DE</td><td>IMC/E ≥ +2 y &lt; +3 DE</td></tr>' +
'<tr><td>Obesidad severa</td><td>—</td><td>—</td><td>IMC/E ≥ +3 DE</td></tr></tbody></table></div>' +
'<div class="tbl"><table><thead><tr><th>Talla para la edad (0–19 años)</th><th>Criterio</th><th>Perímetro de cintura (desde 5 años)</th><th>Criterio</th></tr></thead><tbody>' +
'<tr><td>Talla baja</td><td>T/E ≤ −2 DE</td><td>Normal</td><td>&lt; p75</td></tr>' +
'<tr><td>Talla normal baja</td><td>T/E ≤ −1 y &gt; −2 DE</td><td>Riesgo de obesidad abdominal</td><td>≥ p75 y &lt; p90</td></tr>' +
'<tr><td>Normal</td><td>T/E &gt; −1 y &lt; +1 DE</td><td>Obesidad abdominal</td><td>≥ p90</td></tr>' +
'<tr><td>Talla normal alta</td><td>T/E ≥ +1 y &lt; +2 DE</td><td colspan="2" rowspan="2">Perímetro cefálico/E (hasta 3 años): microcefalia ≤ −2 DE; macrocefalia ≥ +2 DE.</td></tr>' +
'<tr><td>Talla alta</td><td>T/E ≥ +2 DE</td></tr></tbody></table></div>' +

'<h4>Incremento de peso esperado en la gestación (según estado nutricional al inicio del embarazo)</h4>' +
'<div class="tbl"><table><thead><tr><th>Estado nutricional inicial</th><th>Incremento total a las 40 semanas</th><th>g/semana desde la semana 11</th></tr></thead><tbody>' +
'<tr><td>Bajo peso</td><td>12 a 15 kg</td><td>400–600</td></tr><tr><td>Normal</td><td>10 a 13 kg</td><td>330–430</td></tr><tr><td>Sobrepeso</td><td>7 a 10 kg</td><td>230–330</td></tr><tr><td>Obesidad</td><td>6 a 7 kg</td><td>200–330</td></tr></tbody></table></div>' +
'<p class="note">Para el estado nutricional al inicio se usa el IMC pregestacional (o el del primer control, antes de la semana 12) con los puntos de corte de adulto. Durante la gestación se grafica el IMC en la curva IMC/edad gestacional (Atalah, MINSAL).</p>' +

'<h4>IMC en personas adultas y mayores</h4>' +
'<div class="tbl"><table><thead><tr><th>Clasificación</th><th>Adulto 20–64 años (OMS)</th><th>Persona mayor ≥65 años (MINSAL)</th></tr></thead><tbody>' +
'<tr><td>Bajo peso</td><td>&lt; 18,5</td><td>&lt; 23,0</td></tr><tr><td>Normal</td><td>18,5–24,9</td><td>23,0–27,9</td></tr><tr><td>Sobrepeso</td><td>25,0–29,9</td><td>28,0–31,9</td></tr><tr><td>Obesidad</td><td>≥ 30,0</td><td>≥ 32,0</td></tr></tbody></table></div>' +
'<p class="note">Los puntos de corte de IMC de adultos y personas mayores no aparecen en el material del curso; se agregan como referencia complementaria (OMS y MINSAL) para poder hacer los cálculos.</p>';
