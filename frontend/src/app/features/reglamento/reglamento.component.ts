import { Component } from '@angular/core';

@Component({
  selector: 'app-reglamento',
  imports: [],
  template: `             <h2>1. Partidos:</h2>
            <p>Son los cuarenta y ocho (48) partidos que se jugarán en la fase de grupos del mundial de Qatar
                2022,
                iniciando el día
                <strong>domingo 20 de
                    noviembre de 2022</strong> y culminando el día <strong>viernes 2 de diciembre de 2022</strong>.
            </p>
            <h2>2. Planilla:</h2>
            <p>La planilla se deberá completar y se podrá descargar desde la sección <a
                    href="/cargar-planilla-fase-grupos.php" title="Planilla Prode Mundial Qatar 2022">#Planilla</a>. La
                misma cuenta con los 48 partidos de
                la fase
                de grupos y solamente se podrá marcar como resultado válido un equipo Local (L), un equipo Visitante (V)
                o un Empate
                (E) por
                cada partido.</p>
            <p>Asimismo deberá contar con la totalidad de los partidos marcados, nombre, apellido y oficina del
                participante.</p>
            <p>Los partidos que no sean marcados serán computados como Nulos.</p>
            <p>Se admiten más de una planilla por participante.</p>
            <h2>3. Valor:</h2>
            <p>La planilla tiene un valor de pesos quinientos <strong>($500)</strong> que deberá ser abonado de manera
                previa o al momento
                de
                confirmar la misma.</p>
            <h2>4. Confirmación de Planillas:</h2>
            <p>Para confirmar la planilla, se deberá presentar el <strong>número único de identificación</strong> de la
                misma generado por el
                sistema. Las planillas se confirmarán ineludiblemente hasta el día viernes 18 de noviembre de 2022 a las
                16:00
                horas.</p>
            <h2>5. Publicación de Planillas:</h2>
            <p>Las planillas debidamente confirmadas, se publicarán el día sábado 19 de noviembre
                de 2022 en la sección
                <a href="/participantes-fase-grupos.php"
                    title="Participantes Prode Mundial Qatar 2022">#Participantes</a> del sitio web.
            </p>
            <h2>6. Resultados:</h2>
            <p>Serán considerados los resultados oficiales de la <abbr lang="fr"
                    title="Fédération Internationale de Football Association">FIFA</abbr> del Mundial Qatar 2022, a su
                vez se podrán ir
                siguiendo
                los resultados de los partidos en la sección <a href="/resultados-fase-grupos.php"
                    title="Resultados Prode Mundial Qatar 2022">#Resultados</a>
                del sitio web.
            </p>
            <h2>7. Ganadores:</h2>
            <p>Será considerado como ganador en el <strong>Primer Puesto</strong> al participante que mayor cantidad de
                puntos
                sume, en caso de haber empate serán considerados como ganadores todos los participantes que hayan
                empatado.
                <br>Será considerado ganador en el <strong>Segundo Puesto</strong> al o los participantes que acierten
                la mayor
                cantidad de puntos detrás del Primer Puesto.
            </p>
            <p>Se publicarán las planillas ganadoras el día sábado 3 de diciembre de 2022 en la sección <a href="#"
                    title="Ganadores Prode Mundial Qatar 2022">#Ganadores</a> del
                sitio web.
            </p>
            <h2>8. Premios:</h2>
            <p>Los premios serán:</p>
            <p><strong>Primer Puesto:</strong> El participante que acierte la mayor cantidad de partidos entre los 48
                jugados
                por fase de grupos, gana el <strong>80% del pozo recaudado</strong>, en caso de haber empate se divide
                entre los
                ganadores.</p>
            <p><strong>Segundo Puesto:</strong> El participante siguiente al Primer Puesto que acierte la mayor cantidad
                de
                partidos entre los 48 jugados por fase de grupos, gana el <strong>20% del pozo recaudado</strong>, en
                caso de
                haber empate se divide entre los ganadores.</p>
            <h2>9. Entrega de Premios:</h2>
            <p>Los premios serán entregados el día lunes 5 de diciembre de 2022 a las 15 horas.</p> `,
  styles: ``,
})
export class ReglamentoComponent {}
