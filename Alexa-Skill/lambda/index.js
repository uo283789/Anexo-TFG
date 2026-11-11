const Alexa = require('ask-sdk-core');
const fetch = require('node-fetch');


// Credenciales de Login with Amazon para obtener tokens de acceso.
const LWA_CLIENT_ID = "amzn1.application-oa2-client.90232163b3a6497fb343cb9194994b40";
const LWA_CLIENT_SECRET = "amzn1.oa2-cs.v1.dc3abd985830737655eb96fbc7fd72dea9eb0073722e8a26f1933e218ec4166b";

// Obtiene la función de traducción configurada para la petición actual.
// Si no está disponible, devuelve las claves de traducción sin modificarlas.
const getT = (handlerInput) => {
  const attrs = handlerInput.attributesManager.getRequestAttributes();
  return attrs.t || ((key, options) => key);
};

// Carga las traducciones y los textos utilizados por la skill.
const languageStrings=require('./localization');

//Funcion para obtener la hora correcta en MySQL
function toSpanishTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Solicita a Login with Amazon un token para acceder a Alexa DataStore.
async function getDatastoreAccessToken() {

  const response = await fetch(
    "https://api.amazon.com/auth/o2/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
        "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: LWA_CLIENT_ID,
        client_secret: LWA_CLIENT_SECRET,
        scope: "alexa::datastore"
            })
        }
    );

    const body = await response.json();
      // Si Amazon rechaza la solicitud, informa del error recibido.
    if (!response.ok) {
        throw new Error(
            `LWA ERROR: ${JSON.stringify(body)}`
        );
    }
    // Devuelve el token necesario para las operaciones con DataStore.
    return body.access_token;
}


//Actualiza los datos almacenados en Alexa DataStore para el dispositivo indicado.
async function updateDatastore(
  datastoreToken,
  commands,
  target
) {

  const response = await fetch(
    "https://api.eu.amazonalexa.com/v1/datastore/commands",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${datastoreToken}`,
        "Content-Type": "application/json"
      },
         // Envía los comandos y el dispositivo al que se aplican.
      body: JSON.stringify({
        commands,
        target
      })
    }
  );
    // Devuelve el contenido de la respuesta de la API.
  const body = await response.text();
  return body;
}

// GESTIONA LOS EVENTOS DE LAS APL.
const APLUserEventHandler = {

  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope)
      === 'Alexa.Presentation.APL.UserEvent';
  },

  async handle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;
    // El primer argumento del evento identifica el botón pulsado.
    const action =request.arguments && request.arguments[0];
    
    // Evita procesar eventos que no incluyan una acción.  
    if (!action) {

      return handlerInput.responseBuilder
        .speak("No se ha recibido ninguna acción.")
        .getResponse();
    }
    // Ejecuta la funcionalidad asociada a cada botón de la interfaz.
    switch (action) {

      case 'start_sleep':
        return await StartSleepIntentHandler.handle(handlerInput);

      case 'end_sleep':
        return await EndSleepIntentHandler.handle(handlerInput);

      case 'sleep_summary':
        return await GetSleepSummaryIntentHandler.handle(handlerInput);
        
      case 'weekly_summary':
        return await GetWeeklyReportIntentHandler.handle(handlerInput);

      case 'get_tip':
        return await GetTipIntentHandler.handle(handlerInput);
      case 'sleep_reminder':
        return await SetSleepReminderIntentHandler.handle(handlerInput);
        
    // Regresa a la interfaz principal de FSleep.    
    case 'backSleepInterface':
        return await LaunchRequestHandler.handle(handlerInput);
        
    // Comprueba si la cuenta está vinculada antes de mostrar el menú.
    case 'check_account': {
          
            console.log(
                "CHECK_ACCOUNT:",
                JSON.stringify(handlerInput.requestEnvelope.context.System.user)
            );
            const token =
            handlerInput.requestEnvelope.context.System.user.accessToken;

            if (token) {

              return await LaunchRequestHandler.handle(handlerInput);

            }

            return handlerInput.responseBuilder
                     .speak("Tu cuenta todavía no está vinculada. Completa la vinculación desde la aplicación Alexa y vuelve a intentarlo.")
                     .getResponse();
            }

    // Gestiona la selección de calidad del sueño mediante botones.
      case 'baja':
      case 'aceptable':
      case 'buena':
      case 'excelente':
        const quality = action;
        
        // Finaliza el estado en el que se esperaba una selección de calidad.
        const sessionAttributes =
              handlerInput.attributesManager.getSessionAttributes();
            
            sessionAttributes.awaitingSleepQuality = false;
            
            handlerInput.attributesManager.setSessionAttributes(
              sessionAttributes
            );
         
        // Consejos disponibles para cada nivel de calidad del sueño.    
        const consejosExcelentes = [
          "Mantén horarios regulares incluso los fines de semana.",
          "Sigue exponiéndote a luz natural durante el día.",
          "Mantén un ambiente oscuro y silencioso al dormir."
        ];
        const consejosBuenos = [
          "Reduce el uso de pantallas antes de dormir.",
          "Evita cenas pesadas por la noche.",
          "Intenta acostarte siempre a la misma hora."
        ];
        const consejosAceptables = [
          "Evita la cafeína antes de dormir.",
          "Haz actividad física regularmente.",
          "Establece una rutina relajante."
        ];
        const consejosBajos = [
          "Crea un entorno oscuro y silencioso.",
          "Evita siestas largas.",
          "Practica técnicas de relajación."
        ];
        
        // Selecciona aleatoriamente un consejo según la calidad indicada.
        let speech = "";
        let visualTip = "";
        if (quality === "excelente") {
          visualTip =
            consejosExcelentes[Math.floor(Math.random() * consejosExcelentes.length)];
          speech =
            "Tu calidad de sueño es excelente. " + visualTip;
        } else if (quality === "buena") {
          visualTip =
            consejosBuenos[Math.floor(Math.random() * consejosBuenos.length)];
          speech =
            "Tu calidad de sueño es buena. " + visualTip;
        } else if (quality === "aceptable") {
          visualTip =
            consejosAceptables[Math.floor(Math.random() * consejosAceptables.length)];
          speech =
            "Tu descanso es aceptable. " + visualTip;
        } else {
          visualTip =
            consejosBajos[Math.floor(Math.random() * consejosBajos.length)];
          speech =
            "Tu calidad de sueño parece baja. " + visualTip;
        }
        
        // Prepara la respuesta hablada de Alexa.
        const responseBuilder =
          handlerInput.responseBuilder
            .speak(speech);
            
        // Comprueba si el dispositivo permite mostrar contenido APL.
        const supportedInterfaces =
          handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
          
        if (supportedInterfaces['Alexa.Presentation.APL']) {
            // Muestra el consejo seleccionado en la pantalla.
          responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: 'sleepGetTip',
            document: {
              type: 'Link',
              src: 'doc://alexa/apl/documents/SleepGetTip'
            },
            datasources: {
              sleepData: {
                tip: visualTip
              }
            }
          });
        }
        return responseBuilder.getResponse();
        // Informa si se recibe una acción que no está contemplada.
        default:
        return handlerInput.responseBuilder
           .speak(`Acción no reconocida: ${action}`)
          .getResponse();
    }
  }
};

//GESTIONA LA APERTURA DE LA SKILL
const LaunchRequestHandler = {
  // Identifica las peticiones que se producen al abrir la skill.
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
},

async  handle(handlerInput) {
    // Comprueba si el usuario ha vinculado su cuenta de Amazon.
    const token = handlerInput.requestEnvelope.context.System.user.accessToken;
    const responseBuilder = handlerInput.responseBuilder;
     // Comprueba si el dispositivo admite la visualización de contenido APL.
    const supportedInterfaces =
      handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
    const supportsAPL = supportedInterfaces['Alexa.Presentation.APL'];
    
     // Si la cuenta no está vinculada, solicita al usuario que complete el proceso.
    if (!token) {
        
      responseBuilder
        .speak("Bienvenido a fsleep. Necesitas vincular tu cuenta para continuar.")
         .reprompt("Cuando hayas completado la vinculación, pulsa el botón de la pantalla.")
        .withLinkAccountCard()
        .withShouldEndSession(false);
        
      // Muestra la pantalla de vinculación si el dispositivo admite APL.
      if (supportsAPL) {
        responseBuilder.addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          token: 'linkAccount',
          document: {
            type: 'Link',
            src: 'doc://alexa/apl/documents/Sleep_intro'
          }
        });
      }
      return responseBuilder.getResponse();
    }
    
    // Si la cuenta está vinculada, da la bienvenida y presenta el menú principal.
    responseBuilder
      .speak("Bienvenido a fsleep, puedes empezar el seguimiento de tu sueño.")
      .reprompt("¿Qué quieres hacer?");
      
    // Muestra el menú principal en dispositivos compatibles con APL.  
    if (supportsAPL) {
      responseBuilder.addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'sleepInterface',
        document: {
          type: 'Link',
          src: 'doc://alexa/apl/documents/SleepInterface'
        }
      });
    }
    return responseBuilder.getResponse();
  }
};



// INICIO DEL SUEÑO
const StartSleepIntentHandler = {
    
  // Reconoce el intent de voz o el botón de inicio de la interfaz APL.
  canHandle(handlerInput) {
        const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
        if (requestType === 'IntentRequest') {
             return Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartSleepIntent';
        }

        if (requestType === 'Alexa.Presentation.APL.UserEvent') {
            const action = handlerInput.requestEnvelope.request.arguments[0];
            return action === 'start_sleep';
        }

        return false;
    },

    async handle(handlerInput) {

    const t = getT(handlerInput);
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    // Evita iniciar otro seguimiento si ya existe uno en curso.
    if (sessionAttributes.sleepStartTime) {
      return handlerInput.responseBuilder
        .speak('Ya hay un seguimiento en curso.')
        .reprompt('Cuando te despiertes, pulsa terminar seguimiento.')
        .withShouldEndSession(false)
        .getResponse();
    }

    // Guarda la fecha y hora de inicio como una marca temporal.
    const sleepStartTime = Date.now();

    sessionAttributes.sleepStartTime = sleepStartTime;
    attributesManager.setSessionAttributes(sessionAttributes);

    console.log('Inicio de sueño guardado:', sleepStartTime);

    const speech = t('MensajeInicioSuenoSinHora');
   // Confirma el inicio y mantiene abierta la sesión para continuar interactuando.
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt('Cuando te despiertes, pulsa terminar seguimiento.')
      .withShouldEndSession(false)
      .getResponse();
  }
};


// FIN DEL SEGUIMIENTO DEL SUEÑO
const EndSleepIntentHandler = {

  // Reconoce el intent de voz o el botón de finalización de APL.
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);

    if (requestType === 'IntentRequest') {
      return Alexa.getIntentName(handlerInput.requestEnvelope) === 'EndSleepIntent';
    }

    if (requestType === 'Alexa.Presentation.APL.UserEvent') {
      const action = handlerInput.requestEnvelope.request.arguments[0];
      return action === 'end_sleep';
    }

    return false;
  },

  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    // Recupera la hora de inicio guardada al comenzar el seguimiento.
    const sleepStartTime = sessionAttributes.sleepStartTime;

    // Impide finalizar el seguimiento si no se ha iniciado previamente.
    if (!sleepStartTime) {
      return handlerInput.responseBuilder
        .speak("No has iniciado ningún seguimiento de sueño.")
        .reprompt("Pulsa empezar seguimiento primero.")
        .withShouldEndSession(false)
        .getResponse();
    }

    // Obtiene la hora de despertar si el usuario la ha indicado por voz.
    const request = handlerInput.requestEnvelope.request;
    let waketime = null;

    if (request.intent && request.intent.slots && request.intent.slots.waketime) {
      waketime = request.intent.slots.waketime.value;
    }

    let sleepEndTime;

    if (waketime) {
      // Construye la fecha de despertar a partir de la fecha de inicio.
      const startDate = new Date(sleepStartTime);
      const [hours, minutes = 0] = waketime.split(':').map(Number);

      sleepEndTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        hours,
        minutes
      ).getTime();

      // Si la hora indicada es anterior o igual al inicio, corresponde al día siguiente.
      if (sleepEndTime <= sleepStartTime) {
        sleepEndTime += 24 * 60 * 60 * 1000;
      }
    } else {
      // Si no se indica una hora, utiliza el momento actual.
      sleepEndTime = Date.now();
    }

    // Calcula la duración total del seguimiento en minutos.
    const durationMinutes =
      Math.round((sleepEndTime - sleepStartTime) / 60000);

    // Guarda la hora de finalización y la duración en los atributos de sesión.
    sessionAttributes.sleepEndTime = sleepEndTime;
    sessionAttributes.sleepDuration = durationMinutes;
    attributesManager.setSessionAttributes(sessionAttributes);

    // Confirma que el usuario puede solicitar el resumen del sueño.
    const speech =
      'He registrado que te has despertado, puedes solicitar el resumen de tu sueño.';

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt("Puedes decir: calidad buena, aceptable o mala")
      .withShouldEndSession(false)
      .getResponse();
  }
};




// RESUMEN DEL SUEÑO
const GetSleepSummaryIntentHandler = {

  // Reconoce el intent de voz o el botón de resumen de la interfaz APL.
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);

    if (requestType === 'IntentRequest') {
      return Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSleepSummaryIntent';
    }

    if (requestType === 'Alexa.Presentation.APL.UserEvent') {
      const action = handlerInput.requestEnvelope.request.arguments[0];
      return action === 'sleep_summary';
    }

    return false;
  },

  async handle(handlerInput) {
    try {
      // Comprueba que la cuenta de Amazon está vinculada.
      const token =
        handlerInput.requestEnvelope.context.System.user.accessToken;

      if (!token) {
        return handlerInput.responseBuilder
          .speak("Necesitas vincular tu cuenta.")
          .withLinkAccountCard()
          .getResponse();
      }

      // Obtiene los datos del sueño desde el backend.
      const response = await fetch(
        'https://unfully-palaestric-corliss.ngrok-free.dev/fitness/sleep',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        return handlerInput.responseBuilder
          .speak("No he podido obtener los datos de tu sueño.")
          .getResponse();
      }

      const data = await response.json();

      // Comprueba que el backend ha devuelto datos válidos.
      if (!data.ok) {
        return handlerInput.responseBuilder
          .speak("No he podido obtener los datos de tu sueño.")
          .getResponse();
      }

      // Convierte la duración total a horas y minutos.
      const totalMinutes = data.duration || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      let quality = "";
      let stars = "";
      let speech = `Has dormido ${hours} horas y ${minutes} minutos. `;

      // Si el registro dura menos de tres horas o no contiene fases,
      // no se calcula la calidad del sueño.
      if (totalMinutes < 180 || !data.hasStages) {
        quality = "No disponible";
        stars = "❔";

        speech +=
          "No has dormido las 3 horas mínimas necesarias para calcular la calidad de tu sueño. ";

        if (data.heartRate > 0) {
          speech +=
            `Tu frecuencia cardíaca media durante el sueño ha sido de ${data.heartRate} pulsaciones por minuto.`;
        }

      } else {
        // Calcula el porcentaje de cada fase respecto a la duración total.
        const deepPercent = (data.deep / totalMinutes) * 100;
        const remPercent = (data.rem / totalMinutes) * 100;
        const awakePercent = (data.awake / totalMinutes) * 100;

        let score = 0;

        // Asigna puntos según el porcentaje de sueño profundo.
        if (deepPercent >= 15 && deepPercent <= 25) score += 40;
        else if (deepPercent >= 10) score += 25;
        else score += 10;

        // Asigna puntos según el porcentaje de sueño REM.
        if (remPercent >= 20 && remPercent <= 25) score += 35;
        else if (remPercent >= 15) score += 20;
        else score += 10;

        // Asigna puntos según el tiempo que la persona ha permanecido despierta.
        if (awakePercent <= 5) score += 25;
        else if (awakePercent <= 10) score += 15;
        else score += 5;

        // Convierte la puntuación total en una categoría de calidad.
        if (score >= 85) {
          quality = "Excelente";
          stars = "⭐⭐⭐⭐";
        } else if (score >= 65) {
          quality = "Buena";
          stars = "⭐⭐⭐";
        } else if (score >= 30) {
          quality = "Aceptable";
          stars = "⭐⭐";
        } else {
          quality = "Mala";
          stars = "⭐";
        }

        // Construye el resumen hablado con las fases del sueño.
        speech +=
          `La calidad de tu sueño ha sido ${quality}. ` +
          `Has tenido ${data.deep} minutos de sueño profundo, ` +
          `${data.light} minutos de sueño ligero y ` +
          `${data.rem} minutos de sueño REM. `;

        if (data.awake > 0) {
          speech +=
            `Has estado despierto ${data.awake} minutos durante la noche. `;
        }

        if (data.heartRate > 0) {
          speech +=
            `Tu frecuencia cardíaca media durante el sueño ha sido de ${data.heartRate} pulsaciones por minuto.`;
        }
      }

      // Recupera las horas de inicio y fin del seguimiento de la sesión.
      const attributesManager = handlerInput.attributesManager;
      const sessionAttributes = attributesManager.getSessionAttributes();

      const sleepStartTime = sessionAttributes.sleepStartTime;
      const sleepEndTime = sessionAttributes.sleepEndTime;

      // Sin las dos horas no se puede registrar el seguimiento completo.
      if (!sleepStartTime || !sleepEndTime) {
        return handlerInput.responseBuilder
          .speak("No hay hora de inicio y de fin de sueño.")
          .withShouldEndSession(false)
          .getResponse();
      }

      // Formatea las fechas para enviarlas al backend.
      // Nota: toISOString() convierte las fechas a UTC.
      const startDate = new Date(sleepStartTime)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      const endDate = new Date(sleepEndTime)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      // Guarda el registro de sueño en el backend.
      const insertResponse = await fetch(
        'https://unfully-palaestric-corliss.ngrok-free.dev/sleep',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sleep_start: startDate,
            sleep_end: endDate,
            sleep_duration: totalMinutes,
            sleep_quality: quality
          })
        }
      );

      // Evita continuar si el backend no ha podido guardar el registro.
      if (!insertResponse.ok) {
        throw new Error(
          `Error al guardar el sueño: HTTP ${insertResponse.status}`
        );
      }

      // Obtiene un token específico para acceder a Alexa DataStore.
      const datastoreToken = await getDatastoreAccessToken();

      // Prepara los datos del último sueño para almacenarlos en DataStore.
      const commands = [
        {
          type: "PUT_OBJECT",
          namespace: "fsleep",
          key: "latestSleep",
          content: {
            duration: `${hours} h ${minutes} min`,
            quality,
            stars
          }
        }
      ];

      // Limita la actualización al dispositivo Alexa que ha realizado la petición.
      const deviceId =
        handlerInput.requestEnvelope.context.System.device.deviceId;

      const target = {
        type: "DEVICES",
        items: [deviceId]
      };

      // Actualiza el DataStore con el resumen más reciente.
      await updateDatastore(datastoreToken, commands, target);

      // Prepara la respuesta hablada.
      const responseBuilder = handlerInput.responseBuilder
        .speak(speech)
        .reprompt("¿Quieres consultar algo más?")
        .withShouldEndSession(false);

      // Comprueba si el dispositivo permite mostrar el resumen visual.
      const supportsAPL =
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces[
          'Alexa.Presentation.APL'
        ];

      if (supportsAPL) {
        // Convierte las horas a formato legible para mostrarlas en pantalla.
        const startTime = toSpanishTime(sleepStartTime);
        const endTime = toSpanishTime(sleepEndTime);

        // Muestra el gráfico con la duración, la calidad y las fases del sueño.
        responseBuilder.addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          token: 'sleepSummary_' + Date.now(),
          document: {
            type: 'Link',
            src: 'doc://alexa/apl/documents/SleepChart'
          },
          datasources: {
            sleepData: {
              startTime,
              endTime,
              duration: `${hours}h ${minutes}min`,
              quality,
              stars,
              deep: totalMinutes >= 180 ? (data.deep || 0) : 0,
              light: totalMinutes >= 180 ? (data.light || 0) : 0,
              rem: totalMinutes >= 180 ? (data.rem || 0) : 0,
              awake: totalMinutes >= 180 ? (data.awake || 0) : 0,
              heartRate: data.heartRate || 0,
              hasStages: totalMinutes >= 180 && data.hasStages
            }
          }
        });
      }

      return responseBuilder.getResponse();

    } catch (error) {
      // Registra el error técnico y devuelve un mensaje comprensible al usuario.
      console.log("ERROR OBTENIENDO RESUMEN:", error);

      return handlerInput.responseBuilder
        .speak("Ha ocurrido un error al obtener tu resumen de sueño.")
        .getResponse();
    }
  }
};





// RESUMEN SEMANAL DEL SUEÑO
const GetWeeklyReportIntentHandler = {

  // Reconoce las peticiones de voz para consultar el informe semanal.
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetWeeklyReportIntent';
  },

  async handle(handlerInput) {
    // Comprueba que la cuenta del usuario está vinculada.
    const token =
      handlerInput.requestEnvelope.context.System.user.accessToken;

    if (!token) {
      return handlerInput.responseBuilder
        .speak("Debes vincular tu cuenta antes de consultar tu informe semanal.")
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      // Recupera del backend los registros de sueño del usuario.
      const response = await fetch(
        'https://unfully-palaestric-corliss.ngrok-free.dev/sleep/weekly',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Comprueba si la petición HTTP se ha completado correctamente.
      if (!response.ok) {
        return handlerInput.responseBuilder
          .speak("No he podido obtener tus datos semanales.")
          .getResponse();
      }

      const sessions = await response.json();

      // Verifica que hay al menos siete registros para elaborar el informe.
      if (!Array.isArray(sessions) || sessions.length < 7) {
        return handlerInput.responseBuilder
          .speak("No tengo suficientes datos de sueño. Necesito al menos siete registros para generar tu resumen semanal.")
          .getResponse();
      }

      // Calcula la duración media del sueño en minutos.
      const totalMinutes = sessions.reduce(
        (total, session) => total + Number(session.sleep_duration || 0),
        0
      );

      const avgMinutes = Math.round(totalMinutes / sessions.length);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;

      // Asigna un valor numérico a cada categoría de calidad.
      const qualityMap = {
        "Excelente": 4,
        "Buena": 3,
        "Aceptable": 2,
        "Mala": 1
      };

      // Calcula la puntuación media de calidad de los registros.
      const totalQuality = sessions.reduce(
        (total, session) => total + (qualityMap[session.sleep_quality] || 0),
        0
      );

      const avgQualityScore = totalQuality / sessions.length;

      // Convierte la puntuación media en una categoría comprensible.
      let qualityText = "Mala";

      if (avgQualityScore >= 3.5) {
        qualityText = "Excelente";
      } else if (avgQualityScore >= 2.5) {
        qualityText = "Buena";
      } else if (avgQualityScore >= 1.5) {
        qualityText = "Aceptable";
      }

      // Prepara los datos del resumen para la respuesta y la interfaz APL.
      const averageSleep = `${hours} h ${minutes} min`;

      const speech =
        `Esta semana has dormido una media de ${hours} horas y ${minutes} minutos por noche. ` +
        `La calidad media de tu sueño ha sido ${qualityText}.`;

      const responseBuilder = handlerInput.responseBuilder
        .speak(speech)
        .reprompt("¿Quieres algo más?")
        .withShouldEndSession(false);

      // Comprueba si el dispositivo admite contenido visual APL.
      const supportedInterfaces =
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces;

      if (supportedInterfaces['Alexa.Presentation.APL']) {
        // Muestra la duración y la calidad medias en la pantalla.
        responseBuilder.addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          token: 'sleepWeeklyChart',
          document: {
            type: 'Link',
            src: 'doc://alexa/apl/documents/SleepChartWeekly'
          },
          datasources: {
            weeklyData: {
              averageSleep,
              averageQuality: qualityText
            }
          }
        });
      }

      return responseBuilder.getResponse();

    } catch (error) {
      // Registra el error técnico y ofrece una respuesta controlada al usuario.
      console.log("Error obteniendo informe semanal:", error);

      return handlerInput.responseBuilder
        .speak("Ha ocurrido un error al obtener tu informe semanal.")
        .getResponse();
    }
  }
};



// INICIO DEL FLUJO DE CONSEJOS DE SUEÑO
const GetTipIntentHandler = {

  // Identifica el intent de voz para solicitar consejos sobre el sueño.
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetTipIntent';
  },

  handle(handlerInput) {

    // Marca que la skill está esperando la valoración del usuario.
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.awaitingSleepQuality = true;

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    // Pregunta por la calidad del sueño e indica cómo responder.
    const responseBuilder = handlerInput.responseBuilder
      .speak("¿Cómo ha sido tu calidad del sueño reciente?")
      .reprompt("Pulsa una opción o dime baja, aceptable, buena o excelente.");

    // Comprueba si el dispositivo permite mostrar contenido APL.
    const supportedInterfaces =
      handlerInput.requestEnvelope.context.System.device.supportedInterfaces;

    if (supportedInterfaces['Alexa.Presentation.APL']) {

      // Muestra la pantalla con las opciones de calidad del sueño.
      responseBuilder.addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'sleepQualitySelector',
        document: {
          type: 'Link',
          src: 'doc://alexa/apl/documents/SleepGetQuality'
        },
        datasources: {
          sleepData: {}
        }
      });
    }

    return responseBuilder.getResponse();
  }
};



// SELECCIÓN DE LA CALIDAD DEL SUEÑO
const SleepQualityIntentHandler = {

    // Comprueba si la petición corresponde al intent SleepQualityIntent.
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope)
            === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope)
            === 'SleepQualityIntent';
    },

    handle(handlerInput) {

        // Obtiene los slots de la petición y admite ambos nombres posibles.
        const slots =
            handlerInput.requestEnvelope.request.intent.slots || {};

        const qualitySlot = slots.Quality || slots.quality;

        // Normaliza el valor para evitar problemas con mayúsculas y espacios.
        const quality = qualitySlot && qualitySlot.value
            ? qualitySlot.value.trim().toLowerCase()
            : '';

        // Valores de calidad admitidos por la skill.
        const validQualities = [
            'baja',
            'aceptable',
            'buena',
            'excelente'
        ];

        // Si la calidad no es válida, solicita al usuario que la indique de nuevo.
        if (!validQualities.includes(quality)) {
            const mensaje =
                'La calidad de sueño indicada no es válida. ' +
                'Debes seleccionar una de estas cuatro opciones: ' +
                'baja, aceptable, buena o excelente.';

            return handlerInput.responseBuilder
                .speak(mensaje)
                .reprompt(
                    'Dime baja, aceptable, buena o excelente.'
                )
                .withShouldEndSession(false)
                .getResponse();
        }

        // La calidad es válida: se desactiva el estado de espera.
        const sessionAttributes =
            handlerInput.attributesManager.getSessionAttributes();

        sessionAttributes.awaitingSleepQuality = false;

        handlerInput.attributesManager.setSessionAttributes(
            sessionAttributes
        );

        // Consejos disponibles para cada nivel de calidad del sueño.
        const consejos = {
            excelente: [
                'Mantén horarios regulares incluso los fines de semana.',
                'Sigue exponiéndote a luz natural durante el día.',
                'Mantén un ambiente oscuro y silencioso al dormir.'
            ],
            buena: [
                'Reduce el uso de pantallas antes de dormir.',
                'Evita cenas pesadas por la noche.',
                'Intenta acostarte siempre a la misma hora.'
            ],
            aceptable: [
                'Evita la cafeína antes de dormir.',
                'Haz actividad física regularmente.',
                'Establece una rutina relajante.'
            ],
            baja: [
                'Crea un entorno oscuro y silencioso.',
                'Evita siestas largas.',
                'Practica técnicas de relajación.'
            ]
        };

        // Selecciona aleatoriamente uno de los consejos del nivel indicado.
        const listaConsejos = consejos[quality];

        const visualTip =
            listaConsejos[
                Math.floor(Math.random() * listaConsejos.length)
            ];

        // Construye la respuesta hablada según la calidad seleccionada.
        let speech;

        if (quality === 'excelente') {
            speech = 'Tu calidad de sueño es excelente. ' + visualTip;
        } else if (quality === 'buena') {
            speech = 'Tu calidad de sueño es buena. ' + visualTip;
        } else if (quality === 'aceptable') {
            speech = 'Tu descanso es aceptable. ' + visualTip;
        } else {
            speech = 'Tu calidad de sueño parece baja. ' + visualTip;
        }

        const responseBuilder =
            handlerInput.responseBuilder.speak(speech);

        // Comprueba si el dispositivo admite APL para mostrar el consejo.
        const supportedInterfaces =
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces;

        if (supportedInterfaces['Alexa.Presentation.APL']) {
            responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                token: 'sleepGetTip',
                document: {
                    type: 'Link',
                    src: 'doc://alexa/apl/documents/SleepGetTip'
                },
                // Envía el consejo seleccionado al documento APL.
                datasources: {
                    sleepData: {
                        tip: visualTip
                    }
                }
            });
        }

        // Mantiene abierta la sesión para permitir más interacción.
        return responseBuilder
            .withShouldEndSession(false)
            .getResponse();
    }
};

// RECORDATORIO DE SUEÑO
const SetSleepReminderIntentHandler = {

  // Acepta tanto el intent de voz como el botón correspondiente en APL.
  canHandle(handlerInput) {
    const requestType =
      Alexa.getRequestType(handlerInput.requestEnvelope);

    if (requestType === 'IntentRequest') {
      return Alexa.getIntentName(handlerInput.requestEnvelope)
        === 'SetSleepReminderIntent';
    }

    if (requestType === 'Alexa.Presentation.APL.UserEvent') {
      const action =
        handlerInput.requestEnvelope.request.arguments[0];

      return action === 'sleep_reminder';
    }

    return false;
  },

  async handle(handlerInput) {

    let time = null;

    // Si la petición procede de voz, obtiene la hora del slot.
    if (Alexa.getRequestType(handlerInput.requestEnvelope)
        === 'IntentRequest') {

      const slots =
        handlerInput.requestEnvelope.request.intent.slots;

      if (slots && slots.time && slots.time.value) {
        time = slots.time.value;
      }
    }

    // Si falta la hora, se solicita al usuario.
    if (!time) {
      const speech =
        "¿A qué hora quieres que te recuerde ir a dormir?";

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(speech)
        .withShouldEndSession(false)
        .getResponse();
    }

    // Comprueba que la hora tenga el formato HH:mm.
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(time)) {
      const speech =
        "La hora indicada no es válida. Indica una hora entre las cero y las veintitrés, y los minutos entre cero y cincuenta y nueve. Por ejemplo, las veintidós y treinta.";

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(
          "¿A qué hora quieres que te recuerde ir a dormir? Indica una hora válida."
        )
        .withShouldEndSession(false)
        .getResponse();
    }

    try {

      // Comprueba que Alexa permita acceder al servicio de recordatorios.
      if (!handlerInput.serviceClientFactory) {
        return handlerInput.responseBuilder
          .speak(
            "No se ha podido acceder al servicio de recordatorios."
          )
          .getResponse();
      }

      // Obtiene el cliente que permite crear recordatorios de Alexa.
      const reminderClient =
        handlerInput.serviceClientFactory
          .getReminderManagementServiceClient();

      // Separa la hora y los minutos introducidos por el usuario.
      const [hour, minute] = time.split(":").map(Number);

      // Calcula la fecha del próximo recordatorio.
      // IMPORTANTE: revisar que el cálculo utilice Europe/Madrid.
      const now = new Date();

      const reminderDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0
      );

      // Si la hora ya ha pasado, programa el recordatorio para mañana.
      if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      // Construye la petición que se enviará al servicio de Alexa.
      const reminderRequest = {
        requestTime: new Date().toISOString(),

        trigger: {
          type: "SCHEDULED_ABSOLUTE",
          scheduledTime:
            reminderDate.toISOString().split(".")[0],
          timeZoneId: "Europe/Madrid"
        },

        alertInfo: {
          spokenInfo: {
            content: [
              {
                locale: "es-ES",
                text: "Es hora de ir a dormir."
              }
            ]
          }
        },

        // Habilita la notificación del recordatorio.
        pushNotification: {
          status: "ENABLED"
        }
      };

      // Solicita a Alexa que cree el recordatorio.
      await reminderClient.createReminder(reminderRequest);

      // Confirma al usuario la hora programada.
      return handlerInput.responseBuilder
        .speak(
          `Perfecto. Te recordaré ir a dormir a las ${time}.`
        )
        .getResponse();

    } catch (error) {

      // Registra el error para facilitar la depuración.
      console.error("Error al crear el recordatorio:", error);

      return handlerInput.responseBuilder
        .speak(
          "Ha ocurrido un error al crear el recordatorio."
        )
        .getResponse();
    }
  }
};

//Intents de cancelacion y parada de la skill
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
      );
  },
  handle(handlerInput) {
    const t = getT(handlerInput);


    return handlerInput.responseBuilder
      .speak(t('MensajeSalida'))
      .getResponse();
  }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
        const sessionAttributes =handlerInput.attributesManager.getSessionAttributes();
        
        // Si estamos esperando la calidad del sueño 
        if (sessionAttributes.awaitingSleepQuality) {
          const msg =
            'No he entendido tu respuesta. Indica una de estas cuatro calidades: baja, aceptable, buena o excelente.';
        
          return handlerInput.responseBuilder
            .speak(msg)
            .reprompt(
              '¿Cómo ha sido tu calidad del sueño? Di baja, aceptable, buena o excelente.'
            )
            .withShouldEndSession(false)
            .getResponse();
        }
        
        // Comportamiento general del fallback
        const t = getT(handlerInput);
        const msg = t('MensajeFallback');
        
        return handlerInput.responseBuilder
          .speak(msg)
          .reprompt(msg)
          .getResponse();
  }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const t = getT(handlerInput);


    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(t('MensajeError'))
      .reprompt(t('MensajeError'))
      .getResponse();
  }
};


// This request interceptor will log all incoming requests to this lambda
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
    }
};
const LoggingResponseInterceptor = {
  process(handlerInput, response) {
    console.log('Outgoing response:', JSON.stringify(response, null, 2));
  }
};


// This response interceptor will log all outgoing responses of this lambda
const LocalizationInterceptor = {
  process(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;

    const localizationClient = require('i18next').createInstance();

    localizationClient.init({
      lng: locale,
      fallbackLng: 'en',
      resources: languageStrings,
      interpolation: {
        escapeValue: false
      }
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = (key, options) => localizationClient.t(key, options);
  }
};




exports.handler = Alexa.SkillBuilders.custom()
   
   .addRequestHandlers(
    
    LaunchRequestHandler,
    
    StartSleepIntentHandler,
    EndSleepIntentHandler,
    GetSleepSummaryIntentHandler,
    GetWeeklyReportIntentHandler,
    GetTipIntentHandler,
    SleepQualityIntentHandler,
    SetSleepReminderIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    APLUserEventHandler,

    )
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LocalizationInterceptor,
        LoggingRequestInterceptor
        )
    .addResponseInterceptors(
       LoggingResponseInterceptor
        )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();