/**
 * Fluvio — English practice corpus for Arabic-L1 learners.
 *
 * SL-04 / SL-05: this replaces the auto-generated corpora. Those shipped 8,800
 * rows that resolved to 3,493 unique IDs, with every `translation` field set to
 * the source text behind a language tag, every `ipa_hint` set to the source text
 * in slashes, randomised topic tags, and sentences such as
 * "Having studying country, You could no longer dance the country with any
 * degree of certainty." graded C2. Learners were scored against that text.
 *
 * Every row below is hand-written and carries a real Modern Standard Arabic
 * translation and real IPA. Each row targets a specific documented Arabic-L1
 * production error, so the corpus doubles as the elicitation set for the
 * phoneme confusion map (see docs/adr/0001-acoustic-scoring.md).
 *
 * ERROR INVENTORY — sources:
 *   Rehman, Silpachai, Levis, Zhao & Gutierrez-Osuna (2022), "The English
 *   pronunciation of Arabic speakers: A data-driven approach to segmental error
 *   identification", Language Teaching Research. L2-ARCTIC, 19,764 phones,
 *   11.14% segmental error rate.
 *   Aldaghri (2019), "Consonant Pronunciation Errors Made by Saudi EFL
 *   Students", AWEJ 10(4). 40 Saudi learners, productive test.
 *
 *   /v/ -> /f/ .......... 100%   (Rehman, unidirectional)
 *   /ʒ/ ................. 84.2%  (Aldaghri)
 *   /ŋ/ -> [ŋg] / [n] ... 80.8%  (Aldaghri)
 *   final 4-C clusters ... 83.8%  (Aldaghri, epenthesis)
 *   -ed morpheme ......... 68.8%  (Aldaghri)
 *   /p/ -> /b/ ........... 63.3%  (Aldaghri) / 27.8% (Rehman)
 *   /ɹ/ -> Arabic trill .. 56.7%  (Aldaghri) / 35.1% (Rehman)
 *   /dʒ/ -> /ʒ/ or /tʃ/ .. 40.1%  (Rehman)
 *   /tʃ/ -> /ʃ/ .......... 30.0%  (Aldaghri)
 *   /oʊ/ -> /ɔ/ .......... 27.5%  (Rehman, monophthongisation)
 *   /z/ -> /s/ ........... 23.0%  (Rehman)
 *   /ð/ -> /z/ or /d/ .... 21.7%  (Rehman)
 *   /eɪ/ -> /ɛ/ .......... 15.2%  (Rehman)
 *   /ɛ/ ~ /ɪ/ ............ 10.6%  (Rehman)
 *
 * SCALE TARGET: 500 items, 12 per phoneme x 14 targets plus distractors.
 * The 45 below are the seed set and the quality bar. Generation protocol and
 * reviewer rubric: docs/corpus-protocol.md. Do not add a row without a real
 * Arabic translation and a real IPA transcription — CI enforces both.
 */

export interface ArabicL1Item {
  id: string;
  text: string;
  /** Modern Standard Arabic. Hand-written, not machine-generated. */
  translation_ar: string;
  /** Real broad IPA transcription, General American. */
  ipa: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topic: string;
  /** The phoneme this item elicits. */
  target_phoneme: string;
  /** What an Arabic-L1 speaker typically substitutes. Feeds the confusion map. */
  predicted_substitution: string;
  /** Contrasting word differing only in the target phoneme, where one exists. */
  minimal_pair?: [string, string];
  error_class: 'substitution' | 'epenthesis' | 'deletion' | 'monophthongisation';
}

export const EN_AR_CORPUS: ArabicL1Item[] = [
  // ---- /p/ vs /b/ : Arabic has no /p/ phoneme -----------------------------
  { id: 'enar_p_001', text: 'Please put the paper in the box.', translation_ar: 'من فضلك ضع الورقة في الصندوق.', ipa: '/pliz pʊt ðə ˈpeɪpɚ ɪn ðə bɑks/', cefr_level: 'A1', topic: 'daily-life', target_phoneme: '/p/', predicted_substitution: '/b/', minimal_pair: ['pat', 'bat'], error_class: 'substitution' },
  { id: 'enar_p_002', text: 'The price of parking is a problem.', translation_ar: 'سعر وقوف السيارات مشكلة.', ipa: '/ðə praɪs əv ˈpɑɹkɪŋ ɪz ə ˈpɹɑbləm/', cefr_level: 'A2', topic: 'transport', target_phoneme: '/p/', predicted_substitution: '/b/', minimal_pair: ['pear', 'bear'], error_class: 'substitution' },
  { id: 'enar_p_003', text: 'He packed a pair of shoes.', translation_ar: 'حزم زوجًا من الأحذية.', ipa: '/hi pækt ə pɛɹ əv ʃuz/', cefr_level: 'A2', topic: 'travel', target_phoneme: '/p/', predicted_substitution: '/b/', minimal_pair: ['pack', 'back'], error_class: 'substitution' },
  { id: 'enar_p_004', text: 'The company plans to expand rapidly.', translation_ar: 'تخطط الشركة للتوسع بسرعة.', ipa: '/ðə ˈkʌmpəni plænz tu ɪkˈspænd ˈɹæpɪdli/', cefr_level: 'B1', topic: 'work', target_phoneme: '/p/', predicted_substitution: '/b/', error_class: 'substitution' },
  { id: 'enar_p_005', text: 'Applicants must provide proof of payment.', translation_ar: 'يجب على المتقدمين تقديم إثبات الدفع.', ipa: '/ˈæplɪkənts mʌst pɹəˈvaɪd pɹuf əv ˈpeɪmənt/', cefr_level: 'B2', topic: 'admin', target_phoneme: '/p/', predicted_substitution: '/b/', error_class: 'substitution' },

  // ---- /v/ -> /f/ : 100% unidirectional in the L2-ARCTIC data -------------
  { id: 'enar_v_001', text: 'Very few visitors arrived.', translation_ar: 'وصل عدد قليل جدًا من الزوار.', ipa: '/ˈvɛɹi fju ˈvɪzɪtɚz əˈɹaɪvd/', cefr_level: 'A2', topic: 'travel', target_phoneme: '/v/', predicted_substitution: '/f/', minimal_pair: ['van', 'fan'], error_class: 'substitution' },
  { id: 'enar_v_002', text: 'I have five vegetables in the van.', translation_ar: 'لديّ خمس خضروات في الشاحنة.', ipa: '/aɪ hæv faɪv ˈvɛdʒtəbəlz ɪn ðə væn/', cefr_level: 'A1', topic: 'food', target_phoneme: '/v/', predicted_substitution: '/f/', minimal_pair: ['vine', 'fine'], error_class: 'substitution' },
  { id: 'enar_v_003', text: 'The service was available every evening.', translation_ar: 'كانت الخدمة متاحة كل مساء.', ipa: '/ðə ˈsɚvɪs wəz əˈveɪləbəl ˈɛvɹi ˈivnɪŋ/', cefr_level: 'B1', topic: 'hospitality', target_phoneme: '/v/', predicted_substitution: '/f/', error_class: 'substitution' },
  { id: 'enar_v_004', text: 'We reviewed the invoice carefully.', translation_ar: 'راجعنا الفاتورة بعناية.', ipa: '/wi ɹɪˈvjud ði ˈɪnvɔɪs ˈkɛɹfəli/', cefr_level: 'B2', topic: 'work', target_phoneme: '/v/', predicted_substitution: '/f/', error_class: 'substitution' },
  { id: 'enar_v_005', text: 'Innovation drives the value of the venture.', translation_ar: 'الابتكار يقود قيمة المشروع.', ipa: '/ˌɪnəˈveɪʃən dɹaɪvz ðə ˈvælju əv ðə ˈvɛntʃɚ/', cefr_level: 'C1', topic: 'business', target_phoneme: '/v/', predicted_substitution: '/f/', error_class: 'substitution' },

  // ---- /ʒ/ : 84.2% error rate, the single hardest consonant --------------
  { id: 'enar_zh_001', text: 'It was a pleasure to measure the garage.', translation_ar: 'كان من دواعي سروري قياس المرآب.', ipa: '/ɪt wəz ə ˈplɛʒɚ tu ˈmɛʒɚ ðə ɡəˈɹɑʒ/', cefr_level: 'B1', topic: 'home', target_phoneme: '/ʒ/', predicted_substitution: '/ʃ/', error_class: 'substitution' },
  { id: 'enar_zh_002', text: 'Usually the decision takes a week.', translation_ar: 'عادةً ما يستغرق القرار أسبوعًا.', ipa: '/ˈjuʒuəli ðə dɪˈsɪʒən teɪks ə wik/', cefr_level: 'B1', topic: 'work', target_phoneme: '/ʒ/', predicted_substitution: '/ʃ/', error_class: 'substitution' },
  { id: 'enar_zh_003', text: 'Television coverage of the occasion was unusual.', translation_ar: 'كانت التغطية التلفزيونية للمناسبة غير عادية.', ipa: '/ˈtɛləvɪʒən ˈkʌvɹɪdʒ əv ði əˈkeɪʒən wəz ʌnˈjuʒuəl/', cefr_level: 'B2', topic: 'media', target_phoneme: '/ʒ/', predicted_substitution: '/ʃ/', error_class: 'substitution' },
  { id: 'enar_zh_004', text: 'Her vision of the merger was precise.', translation_ar: 'كانت رؤيتها للاندماج دقيقة.', ipa: '/hɚ ˈvɪʒən əv ðə ˈmɚdʒɚ wəz pɹɪˈsaɪs/', cefr_level: 'C1', topic: 'business', target_phoneme: '/ʒ/', predicted_substitution: '/ʃ/', error_class: 'substitution' },

  // ---- /ŋ/ -> [ŋɡ] or [n] : 80.8% ---------------------------------------
  { id: 'enar_ng_001', text: 'I am going shopping this morning.', translation_ar: 'سأذهب للتسوق هذا الصباح.', ipa: '/aɪ əm ˈɡoʊɪŋ ˈʃɑpɪŋ ðɪs ˈmɔɹnɪŋ/', cefr_level: 'A1', topic: 'daily-life', target_phoneme: '/ŋ/', predicted_substitution: '[ŋɡ]', minimal_pair: ['sing', 'sin'], error_class: 'epenthesis' },
  { id: 'enar_ng_002', text: 'Singing and running are both relaxing.', translation_ar: 'الغناء والجري كلاهما مريح.', ipa: '/ˈsɪŋɪŋ ənd ˈɹʌnɪŋ ɑɹ boʊθ ɹɪˈlæksɪŋ/', cefr_level: 'A2', topic: 'hobbies', target_phoneme: '/ŋ/', predicted_substitution: '[ŋɡ]', minimal_pair: ['thing', 'thin'], error_class: 'epenthesis' },
  { id: 'enar_ng_003', text: 'The young engineer is working on something long.', translation_ar: 'يعمل المهندس الشاب على شيء طويل.', ipa: '/ðə jʌŋ ˌɛndʒɪˈnɪɹ ɪz ˈwɚkɪŋ ɑn ˈsʌmθɪŋ lɔŋ/', cefr_level: 'B1', topic: 'work', target_phoneme: '/ŋ/', predicted_substitution: '[ŋɡ]', error_class: 'epenthesis' },
  { id: 'enar_ng_004', text: 'Banking regulations are changing.', translation_ar: 'اللوائح المصرفية تتغير.', ipa: '/ˈbæŋkɪŋ ˌɹɛɡjəˈleɪʃənz ɑɹ ˈtʃeɪndʒɪŋ/', cefr_level: 'B2', topic: 'finance', target_phoneme: '/ŋ/', predicted_substitution: '[ŋɡ]', error_class: 'epenthesis' },

  // ---- /ɹ/ -> Arabic trill [r] : 35-57% ----------------------------------
  { id: 'enar_r_001', text: 'The red car is ready.', translation_ar: 'السيارة الحمراء جاهزة.', ipa: '/ðə ɹɛd kɑɹ ɪz ˈɹɛdi/', cefr_level: 'A1', topic: 'transport', target_phoneme: '/ɹ/', predicted_substitution: '[r] trill', error_class: 'substitution' },
  { id: 'enar_r_002', text: 'Our director arrived three hours early.', translation_ar: 'وصل مديرنا قبل ثلاث ساعات.', ipa: '/aʊɚ dəˈɹɛktɚ əˈɹaɪvd θɹi ˈaʊɚz ˈɚli/', cefr_level: 'B1', topic: 'work', target_phoneme: '/ɹ/', predicted_substitution: '[r] trill', error_class: 'substitution' },
  { id: 'enar_r_003', text: 'Regional growth requires careful research.', translation_ar: 'يتطلب النمو الإقليمي بحثًا دقيقًا.', ipa: '/ˈɹidʒənəl ɡɹoʊθ ɹɪˈkwaɪɚz ˈkɛɹfəl ˈɹisɚtʃ/', cefr_level: 'B2', topic: 'business', target_phoneme: '/ɹ/', predicted_substitution: '[r] trill', error_class: 'substitution' },

  // ---- /dʒ/ -> /ʒ/ or /tʃ/ : 40.1% --------------------------------------
  { id: 'enar_dzh_001', text: 'John enjoys his job in January.', translation_ar: 'يستمتع جون بعمله في يناير.', ipa: '/dʒɑn ɪnˈdʒɔɪz hɪz dʒɑb ɪn ˈdʒænjuɛɹi/', cefr_level: 'A2', topic: 'work', target_phoneme: '/dʒ/', predicted_substitution: '/ʒ/', minimal_pair: ['jeep', 'cheap'], error_class: 'substitution' },
  { id: 'enar_dzh_002', text: 'The judge made a generous judgement.', translation_ar: 'أصدر القاضي حكمًا كريمًا.', ipa: '/ðə dʒʌdʒ meɪd ə ˈdʒɛnɚəs ˈdʒʌdʒmənt/', cefr_level: 'B2', topic: 'legal', target_phoneme: '/dʒ/', predicted_substitution: '/ʒ/', error_class: 'substitution' },
  { id: 'enar_dzh_003', text: 'Digital technology changed the language industry.', translation_ar: 'غيّرت التقنية الرقمية صناعة اللغة.', ipa: '/ˈdɪdʒɪtəl tɛkˈnɑlədʒi tʃeɪndʒd ðə ˈlæŋɡwɪdʒ ˈɪndəstɹi/', cefr_level: 'C1', topic: 'technology', target_phoneme: '/dʒ/', predicted_substitution: '/ʒ/', error_class: 'substitution' },

  // ---- /tʃ/ -> /ʃ/ : 30%, worst in final position ------------------------
  { id: 'enar_tsh_001', text: 'Which chair did you choose?', translation_ar: 'أي كرسي اخترت؟', ipa: '/wɪtʃ tʃɛɹ dɪd ju tʃuz/', cefr_level: 'A2', topic: 'home', target_phoneme: '/tʃ/', predicted_substitution: '/ʃ/', minimal_pair: ['chip', 'ship'], error_class: 'substitution' },
  { id: 'enar_tsh_002', text: 'The teacher watched each match.', translation_ar: 'شاهد المعلم كل مباراة.', ipa: '/ðə ˈtitʃɚ wɑtʃt itʃ mætʃ/', cefr_level: 'B1', topic: 'education', target_phoneme: '/tʃ/', predicted_substitution: '/ʃ/', minimal_pair: ['catch', 'cash'], error_class: 'substitution' },
  { id: 'enar_tsh_003', text: 'Research on future challenges is approaching completion.', translation_ar: 'يقترب البحث حول تحديات المستقبل من الاكتمال.', ipa: '/ˈɹisɚtʃ ɑn ˈfjutʃɚ ˈtʃælɪndʒɪz ɪz əˈpɹoʊtʃɪŋ kəmˈpliʃən/', cefr_level: 'C1', topic: 'academia', target_phoneme: '/tʃ/', predicted_substitution: '/ʃ/', error_class: 'substitution' },

  // ---- /ð/ -> /z/ or /d/ : 21.7% ----------------------------------------
  { id: 'enar_dh_001', text: 'This is the other brother.', translation_ar: 'هذا هو الأخ الآخر.', ipa: '/ðɪs ɪz ði ˈʌðɚ ˈbɹʌðɚ/', cefr_level: 'A1', topic: 'family', target_phoneme: '/ð/', predicted_substitution: '/z/ or /d/', minimal_pair: ['then', 'zen'], error_class: 'substitution' },
  { id: 'enar_dh_002', text: 'They gathered together despite the weather.', translation_ar: 'تجمّعوا معًا رغم الطقس.', ipa: '/ðeɪ ˈɡæðɚd təˈɡɛðɚ dɪˈspaɪt ðə ˈwɛðɚ/', cefr_level: 'B1', topic: 'social', target_phoneme: '/ð/', predicted_substitution: '/z/ or /d/', error_class: 'substitution' },
  { id: 'enar_dh_003', text: 'Neither method is worthy of further funding.', translation_ar: 'لا تستحق أي من الطريقتين تمويلًا إضافيًا.', ipa: '/ˈniðɚ ˈmɛθəd ɪz ˈwɚði əv ˈfɚðɚ ˈfʌndɪŋ/', cefr_level: 'C1', topic: 'academia', target_phoneme: '/ð/', predicted_substitution: '/z/ or /d/', error_class: 'substitution' },

  // ---- /z/ -> /s/ : 23% --------------------------------------------------
  { id: 'enar_z_001', text: 'The zoo closes at zero degrees.', translation_ar: 'تُغلق حديقة الحيوان عند درجة الصفر.', ipa: '/ðə zu ˈkloʊzɪz ət ˈzɪɹoʊ dɪˈɡɹiz/', cefr_level: 'A2', topic: 'leisure', target_phoneme: '/z/', predicted_substitution: '/s/', minimal_pair: ['zip', 'sip'], error_class: 'substitution' },
  { id: 'enar_z_002', text: 'He realises these prizes are his.', translation_ar: 'يدرك أن هذه الجوائز له.', ipa: '/hi ˈɹiəlaɪzɪz ðiz ˈpɹaɪzɪz ɑɹ hɪz/', cefr_level: 'B1', topic: 'social', target_phoneme: '/z/', predicted_substitution: '/s/', minimal_pair: ['prize', 'price'], error_class: 'substitution' },
  { id: 'enar_z_003', text: 'Analysis of the resources was organised by design.', translation_ar: 'نُظّم تحليل الموارد عن قصد.', ipa: '/əˈnæləsɪs əv ðə ˈɹisɔɹsɪz wəz ˈɔɹɡənaɪzd baɪ dɪˈzaɪn/', cefr_level: 'C1', topic: 'business', target_phoneme: '/z/', predicted_substitution: '/s/', error_class: 'substitution' },

  // ---- /oʊ/ monophthongised to /ɔ/ : 27.5% ------------------------------
  { id: 'enar_ou_001', text: 'I know the road home.', translation_ar: 'أعرف الطريق إلى المنزل.', ipa: '/aɪ noʊ ðə ɹoʊd hoʊm/', cefr_level: 'A1', topic: 'transport', target_phoneme: '/oʊ/', predicted_substitution: '/ɔ/', minimal_pair: ['coat', 'caught'], error_class: 'monophthongisation' },
  { id: 'enar_ou_002', text: 'Most of the coal was sold slowly.', translation_ar: 'بيع معظم الفحم ببطء.', ipa: '/moʊst əv ðə koʊl wəz soʊld ˈsloʊli/', cefr_level: 'B1', topic: 'industry', target_phoneme: '/oʊ/', predicted_substitution: '/ɔ/', minimal_pair: ['bowl', 'ball'], error_class: 'monophthongisation' },
  { id: 'enar_ou_003', text: 'Global growth showed a notable slowdown.', translation_ar: 'أظهر النمو العالمي تباطؤًا ملحوظًا.', ipa: '/ˈɡloʊbəl ɡɹoʊθ ʃoʊd ə ˈnoʊtəbəl ˈsloʊdaʊn/', cefr_level: 'B2', topic: 'finance', target_phoneme: '/oʊ/', predicted_substitution: '/ɔ/', error_class: 'monophthongisation' },

  // ---- /eɪ/ -> /ɛ/ : 15.2% ----------------------------------------------
  { id: 'enar_ei_001', text: 'Wait for the train today.', translation_ar: 'انتظر القطار اليوم.', ipa: '/weɪt fɔɹ ðə tɹeɪn təˈdeɪ/', cefr_level: 'A1', topic: 'transport', target_phoneme: '/eɪ/', predicted_substitution: '/ɛ/', minimal_pair: ['wait', 'wet'], error_class: 'monophthongisation' },
  { id: 'enar_ei_002', text: 'They paid a late fee in May.', translation_ar: 'دفعوا رسوم تأخير في مايو.', ipa: '/ðeɪ peɪd ə leɪt fi ɪn meɪ/', cefr_level: 'A2', topic: 'finance', target_phoneme: '/eɪ/', predicted_substitution: '/ɛ/', minimal_pair: ['late', 'let'], error_class: 'monophthongisation' },
  { id: 'enar_ei_003', text: 'The statement explained the delay in great detail.', translation_ar: 'أوضح البيان سبب التأخير بتفصيل كبير.', ipa: '/ðə ˈsteɪtmənt ɪkˈspleɪnd ðə dɪˈleɪ ɪn ɡɹeɪt dɪˈteɪl/', cefr_level: 'B2', topic: 'work', target_phoneme: '/eɪ/', predicted_substitution: '/ɛ/', error_class: 'monophthongisation' },

  // ---- /ɛ/ ~ /ɪ/ confusion : 10.6% --------------------------------------
  { id: 'enar_eih_001', text: 'Did you fill the desk with pens?', translation_ar: 'هل ملأت المكتب بالأقلام؟', ipa: '/dɪd ju fɪl ðə dɛsk wɪð pɛnz/', cefr_level: 'A2', topic: 'office', target_phoneme: '/ɛ/ vs /ɪ/', predicted_substitution: 'merged', minimal_pair: ['pen', 'pin'], error_class: 'substitution' },
  { id: 'enar_eih_002', text: 'The bill on the desk is still pending.', translation_ar: 'الفاتورة على المكتب ما زالت معلقة.', ipa: '/ðə bɪl ɑn ðə dɛsk ɪz stɪl ˈpɛndɪŋ/', cefr_level: 'B1', topic: 'office', target_phoneme: '/ɛ/ vs /ɪ/', predicted_substitution: 'merged', minimal_pair: ['bill', 'bell'], error_class: 'substitution' },

  // ---- Final consonant clusters : 83.8% epenthesis ----------------------
  { id: 'enar_cl_001', text: 'He asked for the texts.', translation_ar: 'طلب النصوص.', ipa: '/hi æskt fɔɹ ðə tɛksts/', cefr_level: 'B1', topic: 'education', target_phoneme: '/ksts/', predicted_substitution: 'vowel epenthesis', error_class: 'epenthesis' },
  { id: 'enar_cl_002', text: 'The twelfths were counted.', translation_ar: 'تم عدّ الأجزاء من اثني عشر.', ipa: '/ðə twɛlfθs wɚ ˈkaʊntɪd/', cefr_level: 'C1', topic: 'maths', target_phoneme: '/lfθs/', predicted_substitution: 'vowel epenthesis', error_class: 'epenthesis' },
  { id: 'enar_cl_003', text: 'She glimpsed the strange street.', translation_ar: 'لمحت الشارع الغريب.', ipa: '/ʃi ɡlɪmpst ðə stɹeɪndʒ stɹit/', cefr_level: 'B2', topic: 'narrative', target_phoneme: '/mpst/ + /stɹ/', predicted_substitution: 'vowel epenthesis', error_class: 'epenthesis' },
  { id: 'enar_cl_004', text: 'The sixth month starts tomorrow.', translation_ar: 'يبدأ الشهر السادس غدًا.', ipa: '/ðə sɪksθ mʌnθ stɑɹts təˈmɑɹoʊ/', cefr_level: 'B1', topic: 'time', target_phoneme: '/ksθ/', predicted_substitution: 'vowel epenthesis', error_class: 'epenthesis' },

  // ---- -ed morpheme : 68.8% deletion or epenthesis ----------------------
  { id: 'enar_ed_001', text: 'She walked and talked for hours.', translation_ar: 'مشت وتحدثت لساعات.', ipa: '/ʃi wɔkt ənd tɔkt fɔɹ ˈaʊɚz/', cefr_level: 'A2', topic: 'narrative', target_phoneme: '-ed as /t/', predicted_substitution: 'deleted or /ɪd/', error_class: 'deletion' },
  { id: 'enar_ed_002', text: 'They planned and organised the event.', translation_ar: 'خططوا للحدث ونظموه.', ipa: '/ðeɪ plænd ənd ˈɔɹɡənaɪzd ði ɪˈvɛnt/', cefr_level: 'B1', topic: 'work', target_phoneme: '-ed as /d/', predicted_substitution: 'deleted or /ɪd/', error_class: 'deletion' },
  { id: 'enar_ed_003', text: 'The report was completed and submitted.', translation_ar: 'تم إكمال التقرير وتقديمه.', ipa: '/ðə ɹɪˈpɔɹt wəz kəmˈplitɪd ənd səbˈmɪtɪd/', cefr_level: 'B2', topic: 'work', target_phoneme: '-ed as /ɪd/', predicted_substitution: 'over-applied /ɪd/', error_class: 'substitution' },
];

export const EN_AR_CORPUS_COUNT = EN_AR_CORPUS.length;

/** Every distinct phoneme the corpus elicits. Drives the drill surface. */
export const TARGET_PHONEMES: string[] = Array.from(
  new Set(EN_AR_CORPUS.map((i) => i.target_phoneme)),
);

/**
 * The Arabic-L1 phoneme confusion map.
 *
 * This is the asset. Parikh et al. (Interspeech 2025) show that substitution-aware
 * alignment-free GOP beats forced-alignment GOP substantially (0.595 vs 0.242 MCC
 * on their L2 set) — and the gain comes from constraining the substitution space
 * with an L1-specific confusion map. Every published map is Mandarin-L1, because
 * speechocean762 is Mandarin-L1. There is no public Arabic-L1 equivalent.
 *
 * Seeded from the literature; each weight is replaced by a measured conditional
 * probability as labelled recordings accumulate. See docs/adr/0001.
 */
export const AR_L1_CONFUSION_MAP: Record<string, { substitute: string; prior: number; source: string }[]> = {
  '/p/':  [{ substitute: '/b/', prior: 0.63, source: 'Aldaghri 2019' }],
  '/v/':  [{ substitute: '/f/', prior: 0.95, source: 'Rehman et al. 2022' }],
  '/ʒ/':  [{ substitute: '/ʃ/', prior: 0.84, source: 'Aldaghri 2019' },
           { substitute: '∅',   prior: 0.10, source: 'Aldaghri 2019' }],
  '/ŋ/':  [{ substitute: '[ŋɡ]', prior: 0.60, source: 'Aldaghri 2019' },
           { substitute: '/n/',  prior: 0.21, source: 'Aldaghri 2019' }],
  '/ɹ/':  [{ substitute: '[r]', prior: 0.57, source: 'Aldaghri 2019' }],
  '/dʒ/': [{ substitute: '/ʒ/',  prior: 0.28, source: 'Rehman et al. 2022' },
           { substitute: '/tʃ/', prior: 0.12, source: 'Rehman et al. 2022' }],
  '/tʃ/': [{ substitute: '/ʃ/', prior: 0.30, source: 'Aldaghri 2019' }],
  '/ð/':  [{ substitute: '/z/', prior: 0.13, source: 'Rehman et al. 2022' },
           { substitute: '/d/', prior: 0.09, source: 'Rehman et al. 2022' }],
  '/z/':  [{ substitute: '/s/', prior: 0.23, source: 'Rehman et al. 2022' }],
  '/oʊ/': [{ substitute: '/ɔ/', prior: 0.28, source: 'Rehman et al. 2022' }],
  '/eɪ/': [{ substitute: '/ɛ/', prior: 0.15, source: 'Rehman et al. 2022' }],
  '/ɛ/':  [{ substitute: '/ɪ/', prior: 0.11, source: 'Rehman et al. 2022' }],
  '/ɑ/':  [{ substitute: '/ɔ/',  prior: 0.14, source: 'Rehman et al. 2022' },
           { substitute: '/oʊ/', prior: 0.08, source: 'Rehman et al. 2022' }],
  '/b/':  [{ substitute: '/p/', prior: 0.13, source: 'Rehman et al. 2022 (hypercorrection)' }],
};
