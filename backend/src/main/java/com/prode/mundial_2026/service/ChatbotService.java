package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.ChatResponse;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ChatbotService {

    private final List<FAQItem> knowledgeBase = new ArrayList<>();

    public ChatbotService() {
        // --- SECCIÓN: JUEGO Y PARTIDOS ---
        knowledgeBase.add(new FAQItem(
            Arrays.asList("partidos", "sedes", "paises", "donde es", "72", "grupos"),
            "El torneo consta de 72 partidos de fase de grupos, del 11 al 28 de junio de 2026, en sedes de Canadá, Estados Unidos y México."
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("completar", "pronostico", "pronósticos", "planilla", "jugar", "como se juega", "cargar", "datos"),
            "Para jugar, ve a 'Planilla'. Debes marcar L, E o V en los 72 partidos. Necesitas completar nombre, apellido y email. ¡Se admite más de una planilla por participante!"
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("me la juego", "azar", "aleatorio", "automatico"),
            "El botón 'Me la juego' asigna resultados aleatorios a los partidos que no hayas completado. ¡Es ideal si no te decides por algún resultado!"
        ));

        // --- SECCIÓN: COSTOS Y PAGOS ---
        knowledgeBase.add(new FAQItem(
            Arrays.asList("valor", "cuanto sale", "cuanto cuesta", "precio", "pagar", "plata", "$", "5000", "costo"),
            "Cada planilla tiene un valor de $5.000 (cinco mil pesos). Debe ser abonada de manera previa o al momento de confirmarla."
        ));

        // --- SECCIÓN: CONFIRMACIÓN Y CÓDIGOS ---
        knowledgeBase.add(new FAQItem(
            Arrays.asList("confirmar", "confirmacion", "pago", "admin", "administrador", "validar", "oficial"),
            "Para que tu planilla sea oficial, debe confirmarla el administrador mediante el pago del valor de la misma y tu número único de identificación."
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("codigo", "comprobante", "identificacion", "numero", "id"),
            "Al guardar tu planilla, el sistema genera un código único. ¡Guárdalo! Es tu comprobante indispensable para que el administrador la confirme."
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("fecha", "limite", "plazo", "horario", "cuando cierra", "hasta cuando", "inscripcion"),
            "El plazo máximo ineludible para cargar y confirmar planillas es el 10 de junio de 2026 a las 14:00 hs. Las planillas fuera de término no participan."
        ));

        // --- SECCIÓN: PUNTOS Y POSICIONES ---
        knowledgeBase.add(new FAQItem(
            Arrays.asList("puntos", "puntaje", "sumar", "ganar", "goles", "marcador", "x2"),
            "Sumas 1 punto por acierto. Los partidos 'X2' valen 2 puntos. No hace falta acertar goles exactos, solo el resultado (L/E/V)."
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("posiciones", "ranking", "tabla", "puesto", "quien gana", "resultados", "fifa"),
            "Los resultados son los oficiales de la FIFA. La tabla de posiciones se actualiza automáticamente y puedes seguirla en tiempo real en la web."
        ));

        // --- SECCIÓN: PREMIOS Y GANADORES ---
        knowledgeBase.add(new FAQItem(
            Arrays.asList("ganadores", "primer puesto", "segundo puesto", "tercer puesto", "empate", "puestos"),
            "Ganan los que más puntos sumen. El 1ero es el de mayor puntaje, seguido por el 2do y el 3ero. En caso de empate, todos los que igualen en ese puesto son ganadores."
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("premios", "pozo", "dinero", "cuanto gano", "60%", "30%", "10%", "monto"),
            "Premios: 1er Puesto (60% del pozo), 2do Puesto (30%) y 3er Puesto (10%). Si hay empate en un puesto, el monto se divide en partes iguales entre los ganadores."
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("entrega", "cobrar", "cuando pagan", "5 dias", "donde cobro"),
            "Los premios se entregan dentro de los 5 días hábiles posteriores a la fase de grupos. La modalidad se comunicará por canales oficiales."
        ));

        // --- SECCIÓN: GENERAL ---
        knowledgeBase.add(new FAQItem(
            Arrays.asList("ver", "participantes", "otros", "transparencia", "publico", "auditar"),
            "Para garantizar transparencia, todas las planillas confirmadas serán públicas en la sección 'Participantes' una vez cerrado el período de inscripción."
        ));

        knowledgeBase.add(new FAQItem(
            Arrays.asList("hola", "buenos dias", "buenas tardes", "saludos", "quien eres", "ayuda"),
            "¡Hola! Soy el asistente virtual del Prode Mundial 2026. Puedo ayudarte con dudas sobre premios ($), reglas, puntos, fechas límite y cómo participar. ¿Qué quieres saber?"
        ));
    }

    public ChatResponse getChatResponse(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new ChatResponse("¡Hola! ¿En qué puedo ayudarte hoy?");
        }

        String message = userMessage.toLowerCase();
        
        FAQItem bestMatch = knowledgeBase.stream()
            .max(Comparator.comparingInt(item -> countMatches(item.keywords, message)))
            .orElse(null);

        String response;
        if (bestMatch != null && countMatches(bestMatch.keywords, message) > 0) {
            response = bestMatch.answer;
        } else {
            response = "Lo siento, no tengo esa información específica. Prueba preguntando por 'premios', 'valor de la planilla', 'puntos' o 'fechas límite'.";
        }

        return new ChatResponse(response);
    }

    private int countMatches(List<String> keywords, String message) {
        int count = 0;
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                count++;
            }
        }
        return count;
    }

    private static class FAQItem {
        List<String> keywords;
        String answer;

        FAQItem(List<String> keywords, String answer) {
            this.keywords = keywords;
            this.answer = answer;
        }
    }
}
