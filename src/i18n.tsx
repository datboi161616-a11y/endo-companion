import React, {createContext, useContext, useMemo} from 'react';

export const supportedLanguages = [
  {code: 'en', name: 'English'}, {code: 'es', name: 'Español'},
  {code: 'fr', name: 'Français'}, {code: 'de', name: 'Deutsch'},
  {code: 'it', name: 'Italiano'}, {code: 'pt', name: 'Português'},
] as const;
export type LanguageCode = typeof supportedLanguages[number]['code'];
export function languageName(code: string) {
  return supportedLanguages.find(language => language.code === code)?.name ?? 'English';
}

// Local UI copy only: persisted notes, custom options and log values stay untouched.
// These translations are authored for this reconstruction, not extracted source copy.
const rows = `Today|Hoy|Aujourd’hui|Heute|Oggi|Hoje
Year|Año|Année|Jahr|Anno|Ano
Health|Salud|Santé|Gesundheit|Salute|Saúde
Settings|Ajustes|Réglages|Einstellungen|Impostazioni|Configurações
Language|Idioma|Langue|Sprache|Lingua|Idioma
Back|Atrás|Retour|Zurück|Indietro|Voltar
Close|Cerrar|Fermer|Schließen|Chiudi|Fechar
Done|Listo|Terminé|Fertig|Fine|Concluído
Save|Guardar|Enregistrer|Speichern|Salva|Salvar
Saving…|Guardando…|Enregistrement…|Wird gespeichert…|Salvataggio…|Salvando…
Next|Siguiente|Suivant|Weiter|Avanti|Seguinte
Cancel|Cancelar|Annuler|Abbrechen|Annulla|Cancelar
Delete|Eliminar|Supprimer|Löschen|Elimina|Excluir
Edit|Editar|Modifier|Bearbeiten|Modifica|Editar
Appearance|Apariencia|Apparence|Darstellung|Aspetto|Aparência
System|Sistema|Système|System|Sistema|Sistema
Light|Claro|Clair|Hell|Chiaro|Claro
Dark|Oscuro|Sombre|Dunkel|Scuro|Escuro
Preferences|Preferencias|Préférences|Einstellungen|Preferenze|Preferências
Logging options|Opciones de registro|Options de saisie|Eintragsoptionen|Opzioni di registrazione|Opções de registro
Reports and data|Informes y datos|Rapports et données|Berichte und Daten|Resoconti e dati|Relatórios e dados
Pain Locations|Zonas de dolor|Zones douloureuses|Schmerzstellen|Zone del dolore|Locais da dor
Pain Descriptors|Tipos de dolor|Types de douleur|Schmerzarten|Tipi di dolore|Tipos de dor
Symptoms|Síntomas|Symptômes|Symptome|Sintomi|Sintomas
Medications|Medicamentos|Médicaments|Medikamente|Farmaci|Medicamentos
Medication|Medicamento|Médicament|Medikament|Farmaco|Medicamento
Food|Comida|Alimentation|Essen|Cibo|Alimentação
Flare-up|Crisis de dolor|Crise douloureuse|Schmerzschub|Riacutizzazione|Crise de dor
Bowel movement|Evacuación|Selles|Stuhlgang|Evacuazione|Evacuação
Period|Menstruación|Règles|Periode|Mestruazioni|Menstruação
Heating pad|Almohadilla térmica|Bouillotte|Heizkissen|Termoforo|Bolsa térmica
Daily note|Nota diaria|Note quotidienne|Tagesnotiz|Nota giornaliera|Nota diária
Add Log|Añadir registro|Ajouter une entrée|Eintrag hinzufügen|Aggiungi voce|Adicionar registro
Log Pain|Registrar dolor|Noter une douleur|Schmerzen erfassen|Registra dolore|Registrar dor
Log Period|Registrar menstruación|Noter les règles|Periode erfassen|Registra mestruazioni|Registrar menstruação
Log Food|Registrar comida|Noter un repas|Essen erfassen|Registra pasto|Registrar refeição
Log Bowel Movement|Registrar evacuación|Noter les selles|Stuhlgang erfassen|Registra evacuazione|Registrar evacuação
Log Heating Pad|Registrar calor|Noter la bouillotte|Heizkissen erfassen|Registra termoforo|Registrar bolsa térmica
Log TENS|Registrar TENS|Noter une séance TENS|TENS erfassen|Registra TENS|Registrar TENS
Calendar|Calendario|Calendrier|Kalender|Calendario|Calendário
Choose a month|Elegir un mes|Choisir un mois|Monat wählen|Scegli un mese|Escolher mês
Previous year|Año anterior|Année précédente|Vorheriges Jahr|Anno precedente|Ano anterior
Next year|Año siguiente|Année suivante|Nächstes Jahr|Anno successivo|Ano seguinte
Filter logs|Filtrar registros|Filtrer les entrées|Einträge filtern|Filtra voci|Filtrar registros
All logs|Todos los registros|Toutes les entrées|Alle Einträge|Tutte le voci|Todos os registros
Logs|Registros|Entrées|Einträge|Voci|Registros
Last 30 days|Últimos 30 días|30 derniers jours|Letzte 30 Tage|Ultimi 30 giorni|Últimos 30 dias
Days logged|Días registrados|Jours renseignés|Erfasste Tage|Giorni registrati|Dias registrados
Average pain|Dolor medio|Douleur moyenne|Durchschnittliche Schmerzen|Dolore medio|Dor média
Highest pain|Dolor máximo|Douleur maximale|Stärkste Schmerzen|Dolore massimo|Dor máxima
Last period log|Última menstruación|Dernières règles notées|Letzter Periodeneintrag|Ultime mestruazioni registrate|Última menstruação registrada
Share report|Compartir informe|Partager le rapport|Bericht teilen|Condividi resoconto|Compartilhar relatório
PDF Report|Informe PDF|Rapport PDF|PDF-Bericht|Resoconto PDF|Relatório PDF
Report|Informe|Rapport|Bericht|Resoconto|Relatório
Date range|Intervalo de fechas|Période|Zeitraum|Intervallo di date|Intervalo de datas
All dates|Todas las fechas|Toutes les dates|Alle Daten|Tutte le date|Todas as datas
Start date|Fecha inicial|Date de début|Startdatum|Data iniziale|Data inicial
End date|Fecha final|Date de fin|Enddatum|Data finale|Data final
Preview|Vista previa|Aperçu|Vorschau|Anteprima|Prévia
Export PDF|Exportar PDF|Exporter le PDF|PDF exportieren|Esporta PDF|Exportar PDF
Exporting…|Exportando…|Exportation…|Wird exportiert…|Esportazione…|Exportando…
Export diary backup|Exportar copia del diario|Exporter une sauvegarde|Tagebuch sichern|Esporta backup del diario|Exportar backup do diário
Import diary backup|Importar copia del diario|Importer une sauvegarde|Tagebuch importieren|Importa backup del diario|Importar backup do diário
New option|Nueva opción|Nouvelle option|Neue Option|Nuova opzione|Nova opção
Add an option|Añadir una opción|Ajouter une option|Option hinzufügen|Aggiungi un’opzione|Adicionar opção
Add option|Añadir opción|Ajouter une option|Option hinzufügen|Aggiungi opzione|Adicionar opção
Edit log|Editar registro|Modifier l’entrée|Eintrag bearbeiten|Modifica voce|Editar registro
Delete log|Eliminar registro|Supprimer l’entrée|Eintrag löschen|Elimina voce|Excluir registro
Notes|Notas|Notes|Notizen|Note|Notas
When did you feel pain?|¿Cuándo sentiste dolor?|Quand avez-vous eu mal ?|Wann hatten Sie Schmerzen?|Quando hai sentito dolore?|Quando sentiu dor?
Where did it hurt?|¿Dónde te dolió?|Où aviez-vous mal ?|Wo tat es weh?|Dove faceva male?|Onde doeu?
How did it hurt?|¿Cómo era el dolor?|Quel type de douleur ?|Wie fühlte sich der Schmerz an?|Che tipo di dolore era?|Como era a dor?
How painful is it?|¿Cuánto duele?|Quelle est l’intensité ?|Wie stark sind die Schmerzen?|Quanto fa male?|Qual a intensidade da dor?
Any other symptoms?|¿Otros síntomas?|D’autres symptômes ?|Weitere Symptome?|Altri sintomi?|Outros sintomas?
Anything else?|¿Algo más?|Autre chose ?|Sonst noch etwas?|Altro?|Mais alguma coisa?
When did you eat?|¿Cuándo comiste?|Quand avez-vous mangé ?|Wann haben Sie gegessen?|Quando hai mangiato?|Quando comeu?
What did you eat?|¿Qué comiste?|Qu’avez-vous mangé ?|Was haben Sie gegessen?|Cosa hai mangiato?|O que comeu?
What did you notice after?|¿Qué notaste después?|Qu’avez-vous remarqué ensuite ?|Was fiel Ihnen danach auf?|Cosa hai notato dopo?|O que notou depois?
Did you have flow?|¿Tuviste sangrado?|Avez-vous eu des saignements ?|Hatten Sie eine Blutung?|Hai avuto perdite?|Teve sangramento?
Heating pad session|Sesión de calor|Séance de bouillotte|Heizkissen-Anwendung|Sessione con termoforo|Sessão de calor
TENS session|Sesión TENS|Séance TENS|TENS-Sitzung|Sessione TENS|Sessão TENS
Date and time|Fecha y hora|Date et heure|Datum und Uhrzeit|Data e ora|Data e hora
Time of day|Momento del día|Moment de la journée|Tageszeit|Momento della giornata|Período do dia
Morning|Mañana|Matin|Morgen|Mattina|Manhã
Afternoon|Tarde|Après-midi|Nachmittag|Pomeriggio|Tarde
Evening|Atardecer|Soir|Abend|Sera|Noite
Night|Noche|Nuit|Nacht|Notte|Madrugada
Pain locations|Zonas de dolor|Zones douloureuses|Schmerzstellen|Zone del dolore|Locais da dor
Pain descriptors|Tipos de dolor|Types de douleur|Schmerzarten|Tipi di dolore|Tipos de dor
Treatments or medications|Tratamientos o medicamentos|Traitements ou médicaments|Behandlungen oder Medikamente|Trattamenti o farmaci|Tratamentos ou medicamentos
Add note|Añadir nota|Ajouter une note|Notiz hinzufügen|Aggiungi nota|Adicionar nota
Add any additional notes…|Añade notas adicionales…|Ajoutez des notes…|Weitere Notizen hinzufügen…|Aggiungi altre note…|Adicione outras notas…
Food and drinks|Comida y bebida|Aliments et boissons|Essen und Getränke|Cibi e bevande|Alimentos e bebidas
Meal details|Detalles de la comida|Détails du repas|Mahlzeitdetails|Dettagli del pasto|Detalhes da refeição
Describe your meal|Describe tu comida|Décrivez votre repas|Beschreiben Sie Ihre Mahlzeit|Descrivi il pasto|Descreva a refeição
Add a photo|Añadir foto|Ajouter une photo|Foto hinzufügen|Aggiungi foto|Adicionar foto
Replace photo|Reemplazar foto|Remplacer la photo|Foto ersetzen|Sostituisci foto|Substituir foto
Remove photo|Quitar foto|Supprimer la photo|Foto entfernen|Rimuovi foto|Remover foto
How you felt|Cómo te sentiste|Votre ressenti|Ihr Befinden|Come ti sei sentito|Como se sentiu
Good|Bien|Bien|Gut|Bene|Bem
Okay|Regular|Moyen|Okay|Discretamente|Razoável
Uncomfortable|Incómodo|Inconfortable|Unwohl|A disagio|Desconfortável
Very uncomfortable|Muy incómodo|Très inconfortable|Sehr unwohl|Molto a disagio|Muito desconfortável
Flow level|Nivel de sangrado|Flux menstruel|Blutungsstärke|Flusso mestruale|Fluxo menstrual
No Flow|Sin sangrado|Aucun flux|Keine Blutung|Nessun flusso|Sem fluxo
Spotting|Manchado|Petites pertes|Schmierblutung|Spotting|Pequenas perdas
Medium|Medio|Moyen|Mittel|Medio|Médio
Heavy|Abundante|Abondant|Stark|Abbondante|Intenso
Bristol stool type|Tipo de heces Bristol|Type de selles Bristol|Bristol-Stuhltyp|Tipo di feci Bristol|Tipo de fezes Bristol
Session details|Detalles de la sesión|Détails de la séance|Sitzungsdetails|Dettagli sessione|Detalhes da sessão
Duration in minutes|Duración en minutos|Durée en minutes|Dauer in Minuten|Durata in minuti|Duração em minutos
Electrode placement|Posición de electrodos|Position des électrodes|Elektrodenposition|Posizione elettrodi|Posição dos eletrodos
Heating pad placement|Posición de la almohadilla|Position de la bouillotte|Heizkissenposition|Posizione del termoforo|Posição da bolsa térmica
Intensity or setting|Intensidad o ajuste|Intensité ou réglage|Intensität oder Einstellung|Intensità o impostazione|Intensidade ou ajuste
Heat setting|Nivel de calor|Réglage de chaleur|Wärmestufe|Livello di calore|Nível de calor
Start Now|Empezar ahora|Commencer|Jetzt starten|Inizia ora|Iniciar agora
End Session|Terminar sesión|Terminer la séance|Sitzung beenden|Termina sessione|Encerrar sessão
The Pain Scale|Escala del dolor|Échelle de douleur|Die Schmerzskala|Scala del dolore|Escala da dor
View pain scale|Ver escala del dolor|Voir l’échelle de douleur|Schmerzskala anzeigen|Vedi scala del dolore|Ver escala da dor
Normal|Normal|Normal|Normal|Normale|Normal
Very painful|Muy doloroso|Très douloureux|Sehr schmerzhaft|Molto doloroso|Muito doloroso
Pain free|Sin dolor|Sans douleur|Schmerzfrei|Nessun dolore|Sem dor
Reminders|Recordatorios|Rappels|Erinnerungen|Promemoria|Lembretes
Reminder|Recordatorio|Rappel|Erinnerung|Promemoria|Lembrete
Add reminder|Añadir recordatorio|Ajouter un rappel|Erinnerung hinzufügen|Aggiungi promemoria|Adicionar lembrete
Time|Hora|Heure|Uhrzeit|Ora|Hora
Repeat|Repetir|Répéter|Wiederholen|Ripeti|Repetir
Every day|Cada día|Tous les jours|Jeden Tag|Ogni giorno|Todos os dias
Enabled|Activado|Activé|Aktiviert|Attivato|Ativado
Voice|Voz|Voix|Stimme|Voce|Voz
Voice settings|Ajustes de voz|Réglages vocaux|Spracheinstellungen|Impostazioni vocali|Configurações de voz
Voice input|Entrada de voz|Saisie vocale|Spracheingabe|Input vocale|Entrada de voz
Start recording|Iniciar grabación|Commencer l’enregistrement|Aufnahme starten|Avvia registrazione|Iniciar gravação
Stop recording|Detener grabación|Arrêter l’enregistrement|Aufnahme stoppen|Ferma registrazione|Parar gravação
Listening…|Escuchando…|Écoute…|Wird zugehört…|In ascolto…|Ouvindo…
Try again.|Inténtalo de nuevo.|Réessayez.|Versuchen Sie es erneut.|Riprova.|Tente novamente.
Delete this log?|¿Eliminar este registro?|Supprimer cette entrée ?|Diesen Eintrag löschen?|Eliminare questa voce?|Excluir este registro?
Very minor annoyance|Molestia mínima|Gêne très légère|Sehr geringe Beeinträchtigung|Fastidio minimo|Incômodo mínimo
Minor annoyance|Molestia leve|Gêne légère|Geringe Beeinträchtigung|Fastidio lieve|Incômodo leve
Annoying enough to be distracting|Distrae por la molestia|Gêne qui distrait|Ablenkend unangenehm|Fastidio che distrae|Incômodo que distrai
Can be ignored when focused|Se puede ignorar al concentrarse|Peut s’oublier en se concentrant|Bei Konzentration ignorierbar|Ignorabile concentrandosi|Pode ser ignorada ao se concentrar
Can’t be ignored for more than 30 minutes|No se puede ignorar más de 30 minutos|Impossible à ignorer plus de 30 minutes|Nicht länger als 30 Minuten ignorierbar|Non ignorabile per più di 30 minuti|Não pode ser ignorada por mais de 30 minutos
Can’t be ignored for any length of time|No se puede ignorar|Impossible à ignorer|Nicht ignorierbar|Non può essere ignorato|Não pode ser ignorada
Makes it difficult to concentrate or sleep|Dificulta concentrarse o dormir|Rend la concentration ou le sommeil difficiles|Erschwert Konzentration oder Schlaf|Rende difficile concentrarsi o dormire|Dificulta a concentração ou o sono
Physical activity severely limited|Actividad física muy limitada|Activité physique très limitée|Körperliche Aktivität stark eingeschränkt|Attività fisica molto limitata|Atividade física muito limitada
Unable to do most activities|Impide la mayoría de actividades|Empêche la plupart des activités|Die meisten Aktivitäten unmöglich|Impedisce quasi tutte le attività|Impede a maioria das atividades
Worst pain imaginable|El peor dolor imaginable|Pire douleur imaginable|Schlimmster vorstellbarer Schmerz|Peggior dolore immaginabile|Pior dor imaginável
Severe constipation|Estreñimiento intenso|Constipation sévère|Starke Verstopfung|Stitichezza grave|Prisão de ventre intensa
Mild constipation|Estreñimiento leve|Constipation légère|Leichte Verstopfung|Stitichezza lieve|Prisão de ventre leve
Separate hard lumps|Bolas duras separadas|Petits morceaux durs séparés|Einzelne harte Klumpen|Grumi duri separati|Bolinhas duras separadas
Lumpy sausage|Forma de salchicha grumosa|En forme de saucisse grumeleuse|Wurstförmig und klumpig|A salsiccia grumosa|Formato de salsicha com caroços
Sausage with surface cracks|Salchicha con grietas|Saucisse avec fissures|Wurst mit Rissen|Salsiccia con crepe|Salsicha com rachaduras
Smooth, soft snake|Forma lisa y blanda|Lisse et souple|Glatt und weich|Liscio e morbido|Liso e macio
Lacking fibre|Falta de fibra|Manque de fibres|Ballaststoffarm|Poche fibre|Falta de fibras
Soft blobs with clear edges|Trozos blandos con bordes definidos|Morceaux mous aux bords nets|Weiche Stücke mit klaren Rändern|Pezzi morbidi con bordi definiti|Pedaços macios com bordas definidas
Diarrhea|Diarrea|Diarrhée|Durchfall|Diarrea|Diarreia
Fluffy pieces, mushy|Trozos blandos y pastosos|Morceaux mous et pâteux|Lockere, breiige Stücke|Pezzi molli e pastosi|Pedaços moles e pastosos
Severe diarrhea|Diarrea intensa|Diarrhée sévère|Starker Durchfall|Diarrea grave|Diarreia intensa
Watery, no solid pieces|Acuoso, sin sólidos|Liquide, sans morceaux solides|Wässrig, ohne feste Stücke|Liquido, senza pezzi solidi|Líquido, sem pedaços sólidos
Add options in Settings.|Añade opciones en Ajustes.|Ajoutez des options dans les réglages.|Optionen in den Einstellungen hinzufügen.|Aggiungi opzioni nelle impostazioni.|Adicione opções nas configurações.
Use YYYY-MM-DD and 24-hour HH:MM.|Usa AAAA-MM-DD y HH:MM de 24 horas.|Utilisez AAAA-MM-JJ et HH:MM sur 24 heures.|JJJJ-MM-TT und HH:MM im 24-Stunden-Format verwenden.|Usa AAAA-MM-GG e HH:MM su 24 ore.|Use AAAA-MM-DD e HH:MM de 24 horas.
Enter a valid date and time.|Introduce fecha y hora válidas.|Saisissez une date et une heure valides.|Gültiges Datum und Uhrzeit eingeben.|Inserisci data e ora valide.|Insira data e hora válidas.
Choose a Bristol type to save this entry.|Elige un tipo Bristol para guardar.|Choisissez un type Bristol pour enregistrer.|Bristol-Typ zum Speichern wählen.|Scegli un tipo Bristol per salvare.|Escolha um tipo Bristol para salvar.
Choose a flow level to save this entry.|Elige un nivel de sangrado para guardar.|Choisissez un flux pour enregistrer.|Blutungsstärke zum Speichern wählen.|Scegli un flusso per salvare.|Escolha um fluxo para salvar.
Enter a whole number of minutes greater than zero.|Introduce un número entero de minutos mayor que cero.|Saisissez un nombre entier de minutes supérieur à zéro.|Ganze Minutenzahl größer als null eingeben.|Inserisci un numero intero di minuti maggiore di zero.|Insira um número inteiro de minutos maior que zero.
Add a note to save this entry.|Añade una nota para guardar.|Ajoutez une note pour enregistrer.|Notiz zum Speichern hinzufügen.|Aggiungi una nota per salvare.|Adicione uma nota para salvar.
Could not save this entry. Please try again.|No se pudo guardar. Inténtalo de nuevo.|Enregistrement impossible. Réessayez.|Speichern fehlgeschlagen. Erneut versuchen.|Impossibile salvare. Riprova.|Não foi possível salvar. Tente novamente.
Choose a photo under 5 MB.|Elige una foto de menos de 5 MB.|Choisissez une photo de moins de 5 Mo.|Foto unter 5 MB wählen.|Scegli una foto sotto 5 MB.|Escolha uma foto menor que 5 MB.
Could not add this photo.|No se pudo añadir esta foto.|Impossible d’ajouter cette photo.|Foto konnte nicht hinzugefügt werden.|Impossibile aggiungere questa foto.|Não foi possível adicionar esta foto.
Enter dates in YYYY-MM-DD format.|Introduce fechas en formato AAAA-MM-DD.|Saisissez les dates au format AAAA-MM-JJ.|Daten im Format JJJJ-MM-TT eingeben.|Inserisci date nel formato AAAA-MM-GG.|Insira datas no formato AAAA-MM-DD.
Choose an end date on or after the start date.|La fecha final debe ser igual o posterior a la inicial.|La date de fin doit suivre ou égaler la date de début.|Enddatum darf nicht vor dem Startdatum liegen.|La data finale non può precedere quella iniziale.|A data final não pode ser anterior à inicial.
PDF sharing is unavailable on this device.|No se pueden compartir PDF en este dispositivo.|Le partage PDF est indisponible sur cet appareil.|PDF-Teilen auf diesem Gerät nicht verfügbar.|Condivisione PDF non disponibile su questo dispositivo.|Compartilhamento de PDF indisponível neste dispositivo.
The PDF could not be exported. Please try again.|No se pudo exportar el PDF. Inténtalo de nuevo.|Exportation PDF impossible. Réessayez.|PDF-Export fehlgeschlagen. Erneut versuchen.|Impossibile esportare il PDF. Riprova.|Não foi possível exportar o PDF. Tente novamente.
Pain trends|Tendencias del dolor|Évolution de la douleur|Schmerzverlauf|Andamento del dolore|Evolução da dor
Recorded pain locations|Zonas de dolor registradas|Zones douloureuses enregistrées|Erfasste Schmerzstellen|Zone del dolore registrate|Locais da dor registrados
Show stool images|Mostrar imágenes de heces|Afficher les images de selles|Stuhlbilder anzeigen|Mostra immagini delle feci|Mostrar imagens de fezes
Show type badges|Mostrar etiquetas de tipo|Afficher les étiquettes de type|Typabzeichen anzeigen|Mostra etichette del tipo|Mostrar rótulos de tipo
Bowel Pain Descriptors|Tipos de dolor intestinal|Types de douleur intestinale|Darm-Schmerzarten|Tipi di dolore intestinale|Tipos de dor intestinal
Voice note|Nota de voz|Note vocale|Sprachnotiz|Nota vocale|Nota de voz
Replace recording|Reemplazar grabación|Remplacer l’enregistrement|Aufnahme ersetzen|Sostituisci registrazione|Substituir gravação
Pause|Pausar|Pause|Pause|Pausa|Pausar
Play|Reproducir|Lire|Abspielen|Riproduci|Reproduzir
Remove|Quitar|Supprimer|Entfernen|Rimuovi|Remover
This voice note could not be opened.|No se pudo abrir esta nota de voz.|Impossible d’ouvrir cette note vocale.|Sprachnotiz konnte nicht geöffnet werden.|Impossibile aprire questa nota vocale.|Não foi possível abrir esta nota de voz.
Voice note ready. Save this log to keep it.|Nota de voz lista. Guarda el registro para conservarla.|Note vocale prête. Enregistrez l’entrée pour la conserver.|Sprachnotiz bereit. Eintrag speichern, um sie zu behalten.|Nota vocale pronta. Salva la voce per conservarla.|Nota de voz pronta. Salve o registro para mantê-la.
Could not save the recording. Please try again.|No se pudo guardar la grabación. Inténtalo de nuevo.|Impossible d’enregistrer l’audio. Réessayez.|Aufnahme konnte nicht gespeichert werden. Erneut versuchen.|Impossibile salvare la registrazione. Riprova.|Não foi possível salvar a gravação. Tente novamente.
Microphone access is off. Allow it in device settings to record a voice note.|El micrófono está desactivado. Actívalo en los ajustes del dispositivo para grabar.|L’accès au microphone est désactivé. Autorisez-le dans les réglages pour enregistrer.|Mikrofonzugriff deaktiviert. Zum Aufnehmen in den Geräteeinstellungen erlauben.|Accesso al microfono disattivato. Consentilo nelle impostazioni per registrare.|Acesso ao microfone desativado. Permita nas configurações para gravar.
Recording could not start. Check microphone access and try again.|No se pudo iniciar la grabación. Revisa el acceso al micrófono e inténtalo de nuevo.|Impossible de démarrer. Vérifiez l’accès au microphone et réessayez.|Aufnahme konnte nicht starten. Mikrofonzugriff prüfen und erneut versuchen.|Impossibile avviare la registrazione. Controlla l’accesso al microfono e riprova.|Não foi possível iniciar a gravação. Verifique o acesso ao microfone e tente novamente.
This recording could not be played.|No se pudo reproducir esta grabación.|Impossible de lire cet enregistrement.|Aufnahme konnte nicht abgespielt werden.|Impossibile riprodurre questa registrazione.|Não foi possível reproduzir esta gravação.
Recording now. Stops automatically at 3 minutes.|Grabando. Se detiene automáticamente a los 3 minutos.|Enregistrement en cours. Arrêt automatique après 3 minutes.|Aufnahme läuft. Automatischer Stopp nach 3 Minuten.|Registrazione in corso. Si ferma dopo 3 minuti.|Gravando. Para automaticamente após 3 minutos.
Up to 3 minutes. Stored only on this device and in your exported backup.|Hasta 3 minutos. Se guarda solo en este dispositivo y en la copia exportada.|Jusqu’à 3 minutes. Stockée uniquement sur cet appareil et dans votre sauvegarde exportée.|Bis zu 3 Minuten. Nur auf diesem Gerät und in Ihrer exportierten Sicherung gespeichert.|Fino a 3 minuti. Salvata solo su questo dispositivo e nel backup esportato.|Até 3 minutos. Salva apenas neste dispositivo e no backup exportado.
Add a reminder|Añadir un recordatorio|Ajouter un rappel|Erinnerung hinzufügen|Aggiungi un promemoria|Adicionar um lembrete
Reminder name|Nombre del recordatorio|Nom du rappel|Name der Erinnerung|Nome del promemoria|Nome do lembrete
Medication or custom reminder|Medicamento o recordatorio personalizado|Médicament ou rappel personnalisé|Medikament oder eigene Erinnerung|Farmaco o promemoria personalizzato|Medicamento ou lembrete personalizado
Time, 24-hour format|Hora, formato de 24 horas|Heure, format 24 heures|Uhrzeit im 24-Stunden-Format|Ora, formato 24 ore|Hora, formato de 24 horas
New reminder time, 24-hour format|Hora del nuevo recordatorio, formato de 24 horas|Heure du nouveau rappel, format 24 heures|Neue Erinnerungszeit im 24-Stunden-Format|Ora del nuovo promemoria, formato 24 ore|Hora do novo lembrete, formato de 24 horas
Save time|Guardar hora|Enregistrer l’heure|Uhrzeit speichern|Salva ora|Salvar hora
Enter a name for your reminder.|Introduce un nombre para el recordatorio.|Saisissez un nom pour votre rappel.|Namen für die Erinnerung eingeben.|Inserisci un nome per il promemoria.|Insira um nome para o lembrete.
Reminders saved.|Recordatorios guardados.|Rappels enregistrés.|Erinnerungen gespeichert.|Promemoria salvati.|Lembretes salvos.
Unable to save reminders. Please try again.|No se pudieron guardar los recordatorios. Inténtalo de nuevo.|Impossible d’enregistrer les rappels. Réessayez.|Erinnerungen konnten nicht gespeichert werden. Erneut versuchen.|Impossibile salvare i promemoria. Riprova.|Não foi possível salvar os lembretes. Tente novamente.
Saved reminders could not be loaded. Close and reopen this screen to try again.|No se pudieron cargar los recordatorios. Cierra y abre esta pantalla para reintentar.|Impossible de charger les rappels. Fermez puis rouvrez cet écran.|Erinnerungen konnten nicht geladen werden. Diesen Bildschirm schließen und erneut öffnen.|Impossibile caricare i promemoria. Chiudi e riapri questa schermata.|Não foi possível carregar os lembretes. Feche e reabra esta tela.
Local reminders are available in the installed iPhone or Android app.|Los recordatorios locales están disponibles en la app instalada en iPhone o Android.|Les rappels locaux sont disponibles dans l’application installée sur iPhone ou Android.|Lokale Erinnerungen sind in der installierten iPhone- oder Android-App verfügbar.|I promemoria locali sono disponibili nell’app installata su iPhone o Android.|Lembretes locais estão disponíveis no aplicativo instalado no iPhone ou Android.
Notifications are off. Allow notifications for Endolog in device settings, then try again.|Las notificaciones están desactivadas. Permite las de Endolog en los ajustes y reintenta.|Les notifications sont désactivées. Autorisez celles d’Endolog dans les réglages, puis réessayez.|Benachrichtigungen deaktiviert. Endolog-Benachrichtigungen in den Geräteeinstellungen erlauben und erneut versuchen.|Notifiche disattivate. Consenti le notifiche di Endolog nelle impostazioni e riprova.|Notificações desativadas. Permita notificações do Endolog nas configurações e tente novamente.
Install the app on your phone to receive local notifications.|Instala la app en tu teléfono para recibir notificaciones locales.|Installez l’application sur votre téléphone pour recevoir des notifications locales.|App auf dem Telefon installieren, um lokale Benachrichtigungen zu erhalten.|Installa l’app sul telefono per ricevere notifiche locali.|Instale o aplicativo no celular para receber notificações locais.
A gentle reminder to check in with yourself. Reminders repeat daily at your device’s local time.|Un recordatorio para cuidar de ti. Se repiten cada día a la hora local del dispositivo.|Un petit rappel pour prendre de vos nouvelles. Les rappels se répètent chaque jour à l’heure locale de votre appareil.|Eine sanfte Erinnerung, auf sich zu achten. Erinnerungen wiederholen sich täglich zur Ortszeit Ihres Geräts.|Un promemoria per prenderti cura di te. Si ripete ogni giorno all’ora locale del dispositivo.|Um lembrete para cuidar de si. Os lembretes se repetem diariamente no horário local do dispositivo.
Notifications can appear on your lock screen. Reminder schedules stay on this device and are not included in diary backups.|Las notificaciones pueden aparecer en la pantalla bloqueada. Los horarios se guardan en este dispositivo y no se incluyen en las copias del diario.|Les notifications peuvent apparaître sur l’écran verrouillé. Les horaires restent sur cet appareil et ne sont pas inclus dans les sauvegardes du journal.|Benachrichtigungen können auf dem Sperrbildschirm erscheinen. Erinnerungszeiten bleiben auf diesem Gerät und sind nicht in Tagebuchsicherungen enthalten.|Le notifiche possono apparire sulla schermata di blocco. Gli orari restano su questo dispositivo e non sono inclusi nei backup del diario.|Notificações podem aparecer na tela bloqueada. Os horários ficam neste dispositivo e não são incluídos nos backups do diário.
Daily check-in|Registro diario|Bilan quotidien|Täglicher Check-in|Controllo giornaliero|Registro diário
Month|Mes|Mois|Monat|Mese|Mês
Days|Días|Jours|Tage|Giorni|Dias
Reminders repeat daily at your device’s local time.|Los recordatorios se repiten cada día a la hora local del dispositivo.|Les rappels se répètent chaque jour à l’heure locale de votre appareil.|Erinnerungen wiederholen sich täglich zur Ortszeit Ihres Geräts.|I promemoria si ripetono ogni giorno all’ora locale del dispositivo.|Os lembretes se repetem diariamente no horário local do dispositivo.
Enter a time in 24-hour format, such as 20:30.|Introduce una hora de 24 horas, como 20:30.|Saisissez une heure au format 24 heures, par exemple 20:30.|Uhrzeit im 24-Stunden-Format eingeben, etwa 20:30.|Inserisci un’ora nel formato 24 ore, ad esempio 20:30.|Insira uma hora no formato de 24 horas, como 20:30.
Unable to read saved reminders.|No se pueden leer los recordatorios guardados.|Impossible de lire les rappels enregistrés.|Gespeicherte Erinnerungen können nicht gelesen werden.|Impossibile leggere i promemoria salvati.|Não foi possível ler os lembretes salvos.
Reminder update failed and schedules could not be restored. Reopen Reminders to retry.|Falló la actualización y no se pudieron restaurar los horarios. Vuelve a abrir Recordatorios.|La mise à jour a échoué et les horaires n’ont pas pu être restaurés. Rouvrez les rappels.|Aktualisierung fehlgeschlagen; Zeitpläne konnten nicht wiederhergestellt werden. Erinnerungen erneut öffnen.|Aggiornamento fallito e orari non ripristinati. Riapri Promemoria.|A atualização falhou e os horários não foram restaurados. Reabra Lembretes.
This cannot be undone.|No se puede deshacer.|Cette action est irréversible.|Dies kann nicht rückgängig gemacht werden.|Questa azione è irreversibile.|Esta ação não pode ser desfeita.`;

const dictionaries: Record<string, Record<string, string>> = {};
for (const row of rows.split('\n')) {
  const [source, ...translations] = row.split('|');
  supportedLanguages.slice(1).forEach(({code}, index) => {
    (dictionaries[code] ??= {})[source] = translations[index] || source;
  });
}
const aliases: Record<string, string> = {'Daily Note': 'Daily note', 'Filter Logs': 'Filter logs', NOTES: 'Notes', '‹  Back': 'Back'};
const englishMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const englishWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function translate(source: string, language: string): string {
  const code = language.toLowerCase().split(/[-_]/)[0];
  if (code === 'en' || !dictionaries[code]) return source;
  const key = aliases[source] ?? source;
  const result = dictionaries[code][key];
  if (result) return source === '‹  Back' ? '‹  ' + result : result;
  const monthIndex = englishMonths.indexOf(source);
  if (monthIndex >= 0) return new Intl.DateTimeFormat(code, {month: 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(2024, monthIndex, 1)));
  const weekdayIndex = englishWeekdays.findIndex(day => day === source || day.slice(0, 3) === source);
  if (weekdayIndex >= 0) return new Intl.DateTimeFormat(code, {weekday: source.length === 3 ? 'short' : 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(2024, 0, 7 + weekdayIndex)));
  const days = /^Last (\d+) days$/.exec(source);
  if (days) return dictionaries[code]['Last 30 days'].replace('30', days[1]);
  return source;
}
const I18nContext = createContext({language: 'en', t: (source: string) => source});
export function I18nProvider({language, children}: React.PropsWithChildren<{language: string}>) {
  const value = useMemo(() => ({language, t: (source: string) => translate(source, language)}), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useTranslation() { return useContext(I18nContext); }
