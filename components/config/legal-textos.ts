// BORRADOR (versión alpha). Plantilla base pendiente de revisión por un abogado antes del lanzamiento.
// Los datos entre [CORCHETES] deben completarse con la información real del responsable.

export type Seccion = { titulo: string; parrafos: string[] };
export type Documento = { nombre: string; version: string; secciones: Seccion[] };

export const AVISO_BORRADOR =
  "Versión alpha. Este texto es una plantilla base y puede cambiar antes del lanzamiento oficial.";

const CONTACTO = "[CORREO DE CONTACTO]";
const RESPONSABLE = "[RAZÓN SOCIAL O NOMBRE DEL RESPONSABLE]";

export const TERMINOS: Documento = {
  nombre: "Términos y condiciones",
  version: "Versión 0.1 (alpha) · Última actualización: [FECHA]",
  secciones: [
    {
      titulo: "1. Aceptación",
      parrafos: [
        `Estos Términos y Condiciones regulan el uso de HouseCrab (la «Plataforma»), operada por ${RESPONSABLE} (el «Responsable» o «nosotros»). Al crear una cuenta o usar la Plataforma declaras que los leíste y los aceptas. Si no estás de acuerdo, no la utilices.`,
      ],
    },
    {
      titulo: "2. Qué es HouseCrab",
      parrafos: [
        "HouseCrab es una plataforma que permite a los arrendatarios publicar pensiones y residencias universitarias en un mapa, y a los estudiantes buscarlas, consultarlas y comunicarse con sus propietarios.",
        "HouseCrab es únicamente un medio de contacto entre usuarios. No es propietaria, administradora ni intermediaria de los inmuebles, y no es parte de los acuerdos de arrendamiento, alojamiento o alimentación que los usuarios celebren entre sí.",
      ],
    },
    {
      titulo: "3. Tipos de usuario",
      parrafos: [
        "• Estudiante: busca pensiones, las consulta, chatea con propietarios y puede calificarlas.",
        "• Arrendatario: publica y administra sus pensiones, y responde a los estudiantes.",
        "• Administrador: personal autorizado de HouseCrab que revisa las pensiones y modera contenido.",
      ],
    },
    {
      titulo: "4. Registro y cuenta",
      parrafos: [
        "• Debes ser mayor de 18 años. Si eres menor de edad, solo puedes usar la Plataforma con la autorización y supervisión de tu representante legal.",
        "• Debes suministrar información veraz, completa y actualizada.",
        "• Eres responsable de la confidencialidad de tu contraseña y de toda la actividad realizada desde tu cuenta. Avísanos de inmediato si sospechas un uso no autorizado.",
        "• Cada persona debe tener una sola cuenta. Está prohibido crear cuentas falsas o a nombre de otra persona.",
        "• Puedes registrarte con correo y contraseña o con tu cuenta de Google.",
      ],
    },
    {
      titulo: "5. Publicación y verificación de pensiones",
      parrafos: [
        "• Ninguna pensión se publica sin revisión previa. Al enviarla a revisión, un administrador podrá comunicarse contigo por el teléfono registrado y verificar los datos del registro para comprobar que la pensión existe.",
        "• Podemos aprobar, rechazar o retirar una publicación en cualquier momento, indicando el motivo cuando corresponda.",
        "• Si modificas datos relevantes de una pensión ya aprobada (nombre, ubicación, dirección, teléfono, fotos, descripción, comodidades o alimentación), esta volverá a revisión y se despublicará hasta nueva aprobación.",
        "• La aprobación no garantiza la calidad, legalidad ni seguridad del inmueble ni el cumplimiento de las condiciones ofrecidas.",
      ],
    },
    {
      titulo: "6. Obligaciones del arrendatario",
      parrafos: [
        "• Publicar solo pensiones sobre las que tengas derecho a ofrecer alojamiento (propietario, administrador o autorizado).",
        "• Mantener veraces y actualizados los precios, la ubicación, las fotos, los servicios y la disponibilidad. Las fotos deben ser del lugar real y de tu autoría o contar con autorización.",
        "• Cumplir la normativa aplicable, incluida la relativa al arrendamiento de vivienda urbana (Ley 820 de 2003), el uso del suelo y la convivencia.",
        "• No discriminar a los estudiantes por motivos prohibidos por la ley.",
        "• Atender de forma respetuosa a los estudiantes que te contacten.",
      ],
    },
    {
      titulo: "7. Obligaciones del estudiante",
      parrafos: [
        "• Usar la Plataforma de buena fe y comunicarte con respeto.",
        "• Verificar por tu cuenta la pensión antes de comprometerte: visitarla, confirmar condiciones y precio, y exigir constancia escrita de lo acordado.",
        "• Calificar únicamente pensiones que conozcas y reflejar tu experiencia real.",
      ],
    },
    {
      titulo: "8. Chat y comunicaciones",
      parrafos: [
        "El chat es para tratar asuntos relacionados con las pensiones. Está prohibido el spam, el acoso, las amenazas, los contenidos ilícitos u ofensivos y la solicitud de datos sensibles o dinero por fuera de lo razonable. Podremos revisar conversaciones específicas cuando exista una denuncia o indicio de uso indebido, respetando la normativa de protección de datos.",
      ],
    },
    {
      titulo: "9. Calificaciones y contenido de los usuarios",
      parrafos: [
        "• Las calificaciones deben corresponder a experiencias reales. Está prohibido calificar la propia pensión, usar cuentas falsas o coordinar calificaciones para inflar o dañar la reputación de una pensión.",
        "• Eres responsable del contenido que publicas (textos, fotos, mensajes). Nos otorgas una licencia limitada, gratuita y no exclusiva para mostrarlo dentro de la Plataforma con el fin de prestar el servicio.",
        "• Podemos retirar contenido que incumpla estos Términos o la ley.",
      ],
    },
    {
      titulo: "10. Conductas prohibidas",
      parrafos: [
        "• Publicar información falsa, engañosa o fraudulenta, o pensiones inexistentes.",
        "• Suplantar a otra persona o entidad.",
        "• Intentar vulnerar la seguridad de la Plataforma, extraer datos de forma masiva o interferir con su funcionamiento.",
        "• Usar la Plataforma para fines ilegales o contrarios a la moral y las buenas costumbres.",
      ],
    },
    {
      titulo: "11. Pagos y acuerdos entre usuarios",
      parrafos: [
        "Actualmente HouseCrab no procesa pagos. Cualquier pago, anticipo o depósito se realiza directamente entre las partes y bajo su exclusiva responsabilidad. Te recomendamos no entregar dinero antes de verificar el inmueble y de contar con un acuerdo claro por escrito.",
      ],
    },
    {
      titulo: "12. Limitación de responsabilidad",
      parrafos: [
        "En la máxima medida permitida por la ley, HouseCrab no responde por la veracidad de la información publicada por los usuarios, por la conducta de estos, por la disponibilidad o condiciones de las pensiones, ni por los daños derivados de los acuerdos entre usuarios. Nada de lo aquí previsto limita los derechos irrenunciables que la ley reconozca a los consumidores.",
      ],
    },
    {
      titulo: "13. Propiedad intelectual",
      parrafos: [
        "El nombre HouseCrab, su logotipo, el diseño y el código de la Plataforma son de propiedad del Responsable o de sus licenciantes. No puedes copiarlos ni usarlos sin autorización previa y por escrito.",
      ],
    },
    {
      titulo: "14. Suspensión y terminación",
      parrafos: [
        "Podemos suspender o cerrar cuentas que incumplan estos Términos. Tú puedes eliminar tu cuenta en cualquier momento desde Configuración → Cuenta; al hacerlo se eliminan tu perfil, tus pensiones, fotos y conversaciones, salvo lo que debamos conservar por obligación legal.",
      ],
    },
    {
      titulo: "15. Versión alpha y disponibilidad",
      parrafos: [
        "La Plataforma se encuentra en fase alpha: puede presentar errores, interrupciones o cambios de funcionamiento, y los datos podrían reiniciarse durante las pruebas. Se ofrece «tal como está», sin garantía de disponibilidad continua.",
      ],
    },
    {
      titulo: "16. Costos",
      parrafos: [
        "El uso de la Plataforma es actualmente gratuito. Si en el futuro se establecen tarifas o comisiones, se informarán con anticipación y no se aplicarán sin tu aceptación.",
      ],
    },
    {
      titulo: "17. Modificaciones",
      parrafos: [
        "Podemos actualizar estos Términos. Los cambios relevantes se informarán dentro de la Plataforma. El uso posterior a la actualización implica su aceptación.",
      ],
    },
    {
      titulo: "18. Ley aplicable y contacto",
      parrafos: [
        "Estos Términos se rigen por las leyes de la República de Colombia. Las controversias se someterán a los jueces competentes de [CIUDAD], sin perjuicio de las competencias de las autoridades de protección al consumidor.",
        `Para preguntas, reclamos o reportes de contenido: ${CONTACTO}.`,
      ],
    },
  ],
};

export const DATOS: Documento = {
  nombre: "Tratamiento de datos",
  version: "Versión 0.1 (alpha) · Última actualización: [FECHA]",
  secciones: [
    {
      titulo: "1. Responsable del tratamiento",
      parrafos: [
        `${RESPONSABLE}, identificado con [NIT / CÉDULA], domicilio en [DIRECCIÓN], ciudad de [CIUDAD], Colombia. Correo para asuntos de datos personales: ${CONTACTO}.`,
        "Esta Política se expide en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas que los modifiquen o complementen.",
      ],
    },
    {
      titulo: "2. Datos que recolectamos",
      parrafos: [
        "• Datos de cuenta: nombre, correo electrónico, fecha de nacimiento, rol (estudiante, arrendatario o administrador) y contraseña (que se almacena cifrada). Si ingresas con Google, recibimos tu nombre y correo desde ese servicio.",
        "• Datos de pensiones (arrendatarios): nombre del lugar, dirección, ubicación geográfica, teléfono, fotografías, descripción, servicios, alimentación y habitaciones con sus precios.",
        "• Contenido y actividad: mensajes de chat, calificaciones y mensajes enviados a soporte.",
        "• Datos técnicos: información de sesión y preferencias (por ejemplo, modo claro u oscuro) guardadas en tu dispositivo.",
        "No solicitamos datos sensibles ni documentos de identidad. Te pedimos no compartirlos en el chat.",
      ],
    },
    {
      titulo: "3. Finalidades",
      parrafos: [
        "• Crear y administrar tu cuenta y autenticarte.",
        "• Permitir la publicación, búsqueda y visualización de pensiones en el mapa.",
        "• Verificar que las pensiones son reales: un administrador revisa el registro y puede contactar al arrendatario por teléfono o correo antes de publicarla.",
        "• Facilitar la comunicación entre estudiantes y arrendatarios mediante el chat.",
        "• Gestionar calificaciones, solicitudes de soporte y reportes de uso indebido.",
        "• Mantener la seguridad de la Plataforma, prevenir fraudes y cumplir obligaciones legales.",
        "• Mejorar el servicio mediante análisis de uso agregado.",
      ],
    },
    {
      titulo: "4. Autorización",
      parrafos: [
        "Tratamos tus datos con tu autorización previa, expresa e informada, que otorgas al registrarte y aceptar esta Política. Puedes revocarla en cualquier momento, salvo cuando exista un deber legal o contractual que exija conservar el dato. Revocarla puede impedir que sigas usando la Plataforma.",
      ],
    },
    {
      titulo: "5. Qué datos ven otros usuarios",
      parrafos: [
        "• Todos los usuarios con sesión pueden ver tu nombre de perfil.",
        "• De una pensión publicada se muestran públicamente: nombre, ubicación, dirección, fotos, descripción, precios, servicios y el teléfono de contacto que el arrendatario registre.",
        "• Los mensajes del chat solo los ven los participantes de la conversación.",
        "• Los administradores acceden a los datos de pensiones y de contacto de sus propietarios únicamente para la revisión y la moderación.",
      ],
    },
    {
      titulo: "6. Derechos del titular",
      parrafos: [
        "De acuerdo con la Ley 1581 de 2012 tienes derecho a:",
        "• Conocer, actualizar y rectificar tus datos personales.",
        "• Solicitar prueba de la autorización otorgada.",
        "• Ser informado sobre el uso que se ha dado a tus datos.",
        "• Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.",
        "• Revocar la autorización y/o solicitar la supresión de tus datos cuando no se respeten los principios y garantías legales.",
        "• Acceder de forma gratuita a tus datos personales.",
        "Puedes actualizar tus datos y eliminar tu cuenta directamente en Configuración → Cuenta.",
      ],
    },
    {
      titulo: "7. Cómo ejercer tus derechos",
      parrafos: [
        `Escríbenos a ${CONTACTO} indicando tu nombre, el correo de tu cuenta y tu solicitud.`,
        "• Consultas: las respondemos en un máximo de diez (10) días hábiles, prorrogables por cinco (5) días hábiles más con aviso previo.",
        "• Reclamos de corrección, actualización o supresión: los atendemos en un máximo de quince (15) días hábiles, prorrogables por ocho (8) días hábiles más con aviso previo.",
      ],
    },
    {
      titulo: "8. Encargados y terceros",
      parrafos: [
        "Para operar la Plataforma usamos proveedores que tratan datos por nuestra cuenta:",
        "• Supabase: autenticación, base de datos y almacenamiento de archivos (fotos).",
        "• Google: inicio de sesión con tu cuenta de Google, si lo eliges.",
        "• OpenStreetMap y servicios asociados: mapas y conversión de coordenadas a direcciones; para ello se envían las coordenadas del punto consultado.",
        "No vendemos tus datos personales.",
      ],
    },
    {
      titulo: "9. Transmisión y transferencia internacional",
      parrafos: [
        "Algunos proveedores pueden almacenar o procesar datos en servidores ubicados fuera de Colombia. En esos casos buscamos que cuenten con medidas de seguridad adecuadas y obligaciones contractuales de confidencialidad, conforme a la normativa colombiana.",
      ],
    },
    {
      titulo: "10. Menores de edad",
      parrafos: [
        "La Plataforma está dirigida a mayores de 18 años. Si eres menor, debes contar con la autorización de tu representante legal, y el tratamiento de tus datos respetará el interés superior del menor y la prevalencia de sus derechos, conforme a la ley.",
      ],
    },
    {
      titulo: "11. Seguridad",
      parrafos: [
        "Adoptamos medidas técnicas y organizativas razonables para proteger tus datos: conexiones cifradas, almacenamiento cifrado de contraseñas y reglas de acceso que limitan qué puede ver cada usuario. Ningún sistema es completamente infalible; te recomendamos usar una contraseña segura y no compartirla.",
      ],
    },
    {
      titulo: "12. Conservación y supresión",
      parrafos: [
        "Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, se borran tu perfil, tus pensiones, fotos y conversaciones. Podremos conservar información mínima por el tiempo que exija la ley, para atender reclamaciones o prevenir fraudes, y copias de respaldo que se eliminan de forma periódica.",
      ],
    },
    {
      titulo: "13. Vigencia y cambios",
      parrafos: [
        "Esta Política rige desde su publicación. Si la modificamos de forma sustancial, te lo informaremos dentro de la Plataforma. La versión vigente estará siempre disponible en Configuración → Información legal.",
      ],
    },
  ],
};

export const DOCUMENTOS: Documento[] = [TERMINOS, DATOS];
