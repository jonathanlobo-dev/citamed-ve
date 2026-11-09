/**
 * legalContent.js - CITAMED.VE
 * Texto de las páginas legales. Se mantiene separado de las pantallas para poder revisarlo (y
 * probarlo) sin tocar el diseño. Describe lo que la plataforma hace hoy; si el funcionamiento
 * cambia, este texto cambia con él.
 */

export const LEGAL_UPDATED = '8 de noviembre de 2026';

export const TERMS = {
  title: 'Términos y Condiciones de Uso',
  updated: LEGAL_UPDATED,
  intro:
    'Al crear una cuenta o usar CitaMed aceptas estos términos. Léelos con calma: explican qué es CitaMed, qué puedes esperar de la plataforma y qué se espera de ti.',
  sections: [
    {
      title: 'Qué es CitaMed',
      paragraphs: [
        'CitaMed es una plataforma tecnológica que conecta a pacientes, médicos y clínicas en Venezuela: directorio médico, agendamiento de citas, sala de espera virtual, perfiles verificados, historia clínica, récipes y documentos médicos verificables, y registro de cobros.',
        'CitaMed no presta servicios médicos, no emite diagnósticos ni sustituye la consulta con un profesional de la salud. La atención médica es responsabilidad exclusiva del médico que la brinda.'
      ]
    },
    {
      title: 'Tu cuenta',
      items: [
        'Debes dar datos verdaderos y mantenerlos al día. Tu correo debe ser tuyo: se usa para verificar tu cuenta y recuperar tu clave.',
        'Eres responsable de guardar tu clave y de lo que se haga con tu cuenta. No la compartas. Si crees que alguien la usó, cámbiala desde "Mi cuenta" y avísanos.',
        'El nombre, el apellido, la cédula y el número de MPPS identifican tu cuenta. Si necesitas corregirlos, pide el cambio desde "Mi cuenta" y un administrador lo revisa.',
        'Debes ser mayor de edad para crear una cuenta. Un adulto responsable puede gestionar la atención de un menor.'
      ]
    },
    {
      title: 'Médicos',
      items: [
        'Para ejercer en CitaMed el médico debe estar legalmente habilitado y dar datos profesionales verdaderos (cédula, número de MPPS, título y especialidad).',
        'Puedes registrarte y preparar tu consultorio de inmediato, pero no puedes atender consultas, emitir récipes ni documentos, ni registrar cobros hasta que un administrador verifique tu identidad profesional.',
        'CitaMed puede suspender o retirar la verificación de un médico si sus datos resultan falsos, si hay quejas fundadas o si incumple estos términos o el Código de Ética Médica de la plataforma.',
        'Eres el único responsable de lo que escribes en la historia clínica, de los récipes y de los documentos que emites.'
      ]
    },
    {
      title: 'Pacientes',
      items: [
        'Puedes buscar médicos, pedir citas, esperar tu turno en la sala de espera virtual y ver tu historia y tus documentos.',
        'Para cualquier urgencia médica no uses CitaMed: acude a un centro de salud o llama a los servicios de emergencia.',
        'Cancelar o no asistir a una cita puede afectar la disponibilidad del médico; hazlo con tiempo desde la plataforma o desde el enlace de tu cita.'
      ]
    },
    {
      title: 'Citas, pagos y recibos',
      paragraphs: [
        'CitaMed no cobra ni toca el dinero de las consultas. El paciente le paga directamente al médico (Pago Móvil, transferencia, Zelle o efectivo) y reporta su pago; el médico lo confirma y la plataforma emite un recibo con número y código de verificación.',
        'Los montos en bolívares se calculan con la tasa oficial del Banco Central de Venezuela vigente al momento del pago. Las tarifas son fijadas por cada médico. Cualquier reclamo por una consulta o un cobro se resuelve entre el paciente y el médico.'
      ]
    },
    {
      title: 'Récipes y documentos verificables',
      paragraphs: [
        'Los récipes, órdenes, reposos, constancias e informes llevan un código y un QR que permiten verificar en línea que son auténticos. Un documento emitido no se borra: si hay un error, se anula y queda el registro.',
        'La verificación pública muestra solo los datos mínimos necesarios para comprobar la autenticidad.'
      ]
    },
    {
      title: 'Asistentes del médico',
      paragraphs: [
        'Un médico puede dar acceso a una asistente para gestionar su agenda, sala de espera y cobros, con los permisos que él decida. La asistente nunca ve la historia clínica de los pacientes. El médico es responsable de las personas a las que da acceso.'
      ]
    },
    {
      title: 'Inteligencia artificial',
      paragraphs: [
        'Algunas funciones ayudan al médico a redactar (por ejemplo, mejorar un texto, ordenar un dictado o preparar indicaciones para el paciente). Son una ayuda: el médico siempre revisa y decide antes de que algo se guarde, y la inteligencia artificial no cambia medicamentos ni dosis.',
        'Antes de enviar un texto a un proveedor de inteligencia artificial, la plataforma retira los datos que identifican al paciente.'
      ]
    },
    {
      title: 'Uso aceptable',
      items: [
        'No uses CitaMed para suplantar a otra persona, publicar información falsa, acosar, ni para fines ilegales.',
        'No intentes entrar a cuentas ajenas, saltarte los controles de seguridad, sobrecargar el servicio ni extraer datos de forma masiva.',
        'No subas archivos con virus ni contenido que no tengas derecho a compartir.'
      ]
    },
    {
      title: 'Disponibilidad del servicio',
      paragraphs: [
        'Hacemos lo posible por mantener CitaMed disponible, pero puede haber interrupciones por mantenimiento o por causas fuera de nuestro control (conexión, proveedores de servicios). Estamos en una etapa de lanzamiento y algunas funciones pueden cambiar.'
      ]
    },
    {
      title: 'Responsabilidad',
      paragraphs: [
        'CitaMed es una herramienta tecnológica. En la máxima medida permitida por la ley, no respondemos por los actos u omisiones de los médicos, por los resultados de una atención médica, ni por decisiones tomadas con base en información que los usuarios cargan. Esto no limita derechos que la ley no permita limitar.'
      ]
    },
    {
      title: 'Suspensión de cuentas',
      paragraphs: [
        'Podemos suspender una cuenta que incumpla estos términos o ponga en riesgo a otras personas. La persona recibe el aviso correspondiente y puede escribirnos a soporte@citamedve.app para aclarar la situación.'
      ]
    },
    {
      title: 'Cambios en estos términos',
      paragraphs: [
        'Podemos actualizar estos términos. Cuando el cambio sea importante te lo avisaremos en la plataforma o por correo. Seguir usando CitaMed después del aviso significa que aceptas la versión nueva.'
      ]
    },
    {
      title: 'Ley aplicable',
      paragraphs: [
        'Estos términos se rigen por las leyes de la República Bolivariana de Venezuela.'
      ]
    }
  ]
};

export const PRIVACY = {
  title: 'Política de Privacidad',
  updated: LEGAL_UPDATED,
  intro:
    'Tu información de salud es de las más sensibles que existen. Esta política explica qué datos guarda CitaMed, para qué, quién puede verlos y qué puedes hacer tú con ellos.',
  sections: [
    {
      title: 'Qué datos guardamos',
      items: [
        'Datos de cuenta: nombre, apellido, cédula, correo, teléfono, fecha de nacimiento y sexo.',
        'Datos de salud de los pacientes: alergias, antecedentes, consultas, signos vitales, diagnósticos, récipes, órdenes y documentos, y los archivos que el paciente o su médico suban.',
        'Datos profesionales de los médicos: número de MPPS, título, especialidad, consultorios, horarios, tarifas y los documentos de verificación.',
        'Datos de cobros: método de pago, referencia y montos de los pagos reportados y confirmados (nunca números de tarjeta ni claves bancarias).',
        'Datos técnicos de seguridad: dispositivos y direcciones desde las que se inicia sesión, y un registro de las acciones importantes (auditoría).'
      ]
    },
    {
      title: 'Para qué los usamos',
      items: [
        'Para crear tu cuenta, verificar tu identidad y permitirte entrar.',
        'Para agendar citas, manejar la sala de espera, llevar la historia clínica y emitir documentos verificables.',
        'Para registrar y confirmar cobros y emitir recibos.',
        'Para proteger la plataforma: detectar accesos sospechosos y mantener un registro de auditoría.',
        'Para enviarte correos del servicio (verificación, recuperación de clave, avisos de tu cuenta y de tus citas).'
      ]
    },
    {
      title: 'Quién puede ver tu información',
      items: [
        'Tú ves toda tu historia, excepto las notas privadas que el médico escribe para sí mismo.',
        'Un médico solo ve las consultas y documentos que él mismo tuvo contigo, además de los datos de perfil y los archivos que tú subiste.',
        'La asistente de un médico ve la agenda, la sala de espera y los cobros, con los permisos que el médico le dé. Nunca ve datos clínicos.',
        'Los administradores de CitaMed pueden ver datos de cuentas para verificar médicos, atender solicitudes y dar soporte; sus acciones quedan registradas.',
        'Cualquier persona con el código de un documento puede verificar que es auténtico, y ve solo los datos mínimos para comprobarlo: no ve tu cédula, teléfono ni diagnóstico.'
      ]
    },
    {
      title: 'Inteligencia artificial',
      paragraphs: [
        'Algunas funciones ayudan al médico a redactar. Antes de enviar un texto a un proveedor de inteligencia artificial, la plataforma retira los datos que identifican al paciente. El médico revisa lo que se propone antes de guardarlo.'
      ]
    },
    {
      title: 'Con quién compartimos datos',
      paragraphs: [
        'No vendemos tus datos. Usamos proveedores que nos prestan infraestructura y servicios, y que solo procesan la información para ese fin: alojamiento y base de datos, distribución de la aplicación, envío de correos y servicios de inteligencia artificial. Algunos están fuera de Venezuela.',
        'Podemos entregar información si una autoridad competente lo exige conforme a la ley.'
      ]
    },
    {
      title: 'Cuánto tiempo los guardamos',
      paragraphs: [
        'Guardamos tus datos mientras tengas cuenta y mientras la ley o la naturaleza de la historia clínica lo requieran. Los documentos médicos emitidos no se borran: si hay un error, se anulan y queda el registro.'
      ]
    },
    {
      title: 'Tus derechos',
      items: [
        'Ver tus datos: están en "Mi cuenta", "Mi historia" y tus citas.',
        'Corregir tus datos: la mayoría los editas tú en tu perfil; el nombre, la cédula y el número de MPPS se cambian con una solicitud en "Mi cuenta" que revisa un administrador.',
        'Pedir que cerremos tu cuenta o resolver cualquier duda sobre tus datos: escríbenos a soporte@citamedve.app. Hay datos de la historia clínica que no se pueden borrar por obligación legal o para proteger a otros pacientes.'
      ]
    },
    {
      title: 'Cómo protegemos tu información',
      items: [
        'Las conexiones van cifradas (HTTPS) y las claves se guardan cifradas de forma irreversible.',
        'Cada rol solo accede a lo que le corresponde y los accesos importantes quedan en un registro de auditoría.',
        'Las llaves de servicios externos se guardan cifradas en el servidor, nunca en el código.',
        'Aun así, ningún sistema es infalible: protege tu clave y avísanos si notas algo extraño.'
      ]
    },
    {
      title: 'Cookies y almacenamiento en tu navegador',
      paragraphs: [
        'CitaMed guarda en tu navegador lo necesario para mantener tu sesión abierta y recordar algunas preferencias. No usamos cookies de publicidad ni de seguimiento de terceros.'
      ]
    },
    {
      title: 'Menores de edad',
      paragraphs: [
        'Las cuentas son para mayores de edad. Un adulto responsable puede gestionar la atención de un menor; la historia de un menor se trata con el mismo cuidado.'
      ]
    },
    {
      title: 'Cambios en esta política',
      paragraphs: [
        'Podemos actualizar esta política. Si el cambio es importante te lo avisaremos en la plataforma o por correo.'
      ]
    }
  ]
};

export const ETHICS = {
  title: 'Código de Ética Médica en CitaMed',
  updated: LEGAL_UPDATED,
  intro:
    'Estos son los compromisos que asume todo médico que ejerce en CitaMed. Complementan, y nunca reemplazan, el Código de Deontología Médica de la Federación Médica Venezolana y las leyes que regulan el ejercicio de la medicina.',
  sections: [
    {
      title: 'Identidad y habilitación',
      items: [
        'Declaro que estoy legalmente habilitado para ejercer la medicina en Venezuela y que mis datos (cédula, número de MPPS, título y especialidad) son verdaderos.',
        'Entiendo que no podré atender, emitir documentos ni cobrar hasta que mi identidad profesional sea verificada, y que la verificación puede retirarse si mis datos resultan falsos.'
      ]
    },
    {
      title: 'Secreto profesional',
      items: [
        'Guardo el secreto profesional sobre todo lo que conozco de mis pacientes a través de la plataforma.',
        'Accedo solo a la información de los pacientes que atiendo y solo para fines de su atención.',
        'No comparto mi cuenta ni mi clave. Si doy acceso a una asistente, le concedo únicamente los permisos que necesita y respondo por su uso.'
      ]
    },
    {
      title: 'Veracidad y responsabilidad clínica',
      items: [
        'La historia clínica, los récipes y los documentos que emito reflejan lo que realmente ocurrió en la consulta.',
        'Reviso y decido personalmente toda sugerencia de la inteligencia artificial antes de guardarla; la responsabilidad clínica es mía.',
        'No emito documentos a nombre de personas a quienes no atendí.'
      ]
    },
    {
      title: 'Relación con el paciente',
      items: [
        'Trato a mis pacientes con respeto, sin discriminación y con información clara sobre su atención y mis tarifas.',
        'Cobro únicamente lo acordado y registro cada pago con veracidad. Anulo un recibo solo con una razón real.',
        'Derivo o recomiendo acudir a urgencias cuando el caso lo requiere.'
      ]
    },
    {
      title: 'Uso responsable de la plataforma',
      items: [
        'No uso CitaMed para publicidad engañosa, promesas de curación ni para captar pacientes de forma indebida.',
        'No intento saltarme los controles de seguridad ni acceder a datos de pacientes que no son míos.'
      ]
    },
    {
      title: 'Incumplimientos',
      paragraphs: [
        'El incumplimiento de estos compromisos puede llevar a la suspensión de mi cuenta y al retiro de mi verificación, sin perjuicio de las responsabilidades legales y deontológicas que correspondan.'
      ]
    }
  ]
};
