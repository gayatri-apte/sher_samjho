/**
 * Starter library of famous classical shers (all public domain:
 * poets who died before 1900, plus Iqbal's 1904 "Tarana-e-Hind").
 * Seeded into global_poetry_cache via POST /admin/seed so Search,
 * Eras, Aaj ka sher, bait-bazi matches and Ustad have real content.
 */
export type Classic = {
  devanagari: string;
  roman: string;
  poet: string;
  themes: string[];
};

export const CLASSICS: Classic[] = [
  {
    poet: "Mirza Ghalib",
    devanagari: "हज़ारों ख़्वाहिशें ऐसी कि हर ख़्वाहिश पे दम निकले\n" +
      "बहुत निकले मिरे अरमान लेकिन फिर भी कम निकले",
    roman: "hazāroñ ḳhvāhisheñ aisī ki har ḳhvāhish pe dam nikle\n" +
      "bahut nikle mire armān lekin phir bhī kam nikle",
    themes: ["longing", "desire"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "दिल-ए-नादाँ तुझे हुआ क्या है\n" +
      "आख़िर इस दर्द की दवा क्या है",
    roman: "dil-e-nādāñ tujhe huā kyā hai\n" +
      "āḳhir is dard kī davā kyā hai",
    themes: ["love", "sorrow"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "हम को मालूम है जन्नत की हक़ीक़त लेकिन\n" +
      "दिल के ख़ुश रखने को 'ग़ालिब' ये ख़याल अच्छा है",
    roman: "ham ko mālūm hai jannat kī haqīqat lekin\n" +
      "dil ke ḳhush rakhne ko 'ġhālib' ye ḳhayāl achchhā hai",
    themes: ["spiritual", "wit"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "इश्क़ ने 'ग़ालिब' निकम्मा कर दिया\n" +
      "वर्ना हम भी आदमी थे काम के",
    roman: "ishq ne 'ġhālib' nikammā kar diyā\n" +
      "varna ham bhī ādmī the kaam ke",
    themes: ["love", "wit"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "रगों में दौड़ते फिरने के हम नहीं क़ाइल\n" +
      "जब आँख ही से न टपका तो फिर लहू क्या है",
    roman: "ragoñ meñ dauḌte phirne ke ham nahīñ qā.il\n" +
      "jab āñkh hī se na Tapkā to phir lahū kyā hai",
    themes: ["sorrow", "passion"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "ये न थी हमारी क़िस्मत कि विसाल-ए-यार होता\n" +
      "अगर और जीते रहते यही इंतिज़ार होता",
    roman: "ye na thī hamārī qismat ki visāl-e-yār hotā\n" +
      "agar aur jīte rahte yahī intizār hotā",
    themes: ["longing", "love"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "कोई उम्मीद बर नहीं आती\n" +
      "कोई सूरत नज़र नहीं आती",
    roman: "koī ummīd bar nahīñ aatī\n" +
      "koī sūrat nazar nahīñ aatī",
    themes: ["sorrow", "despair"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "उन के देखे से जो आ जाती है मुँह पर रौनक़\n" +
      "वो समझते हैं कि बीमार का हाल अच्छा है",
    roman: "un ke dekhe se jo aa jaatī hai muñh par raunaq\n" +
      "vo samajhte haiñ ki bīmār kā haal achchhā hai",
    themes: ["love", "wit"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "हुई मुद्दत कि 'ग़ालिब' मर गया पर याद आता है\n" +
      "वो हर इक बात पर कहना कि यूँ होता तो क्या होता",
    roman: "huī muddat ki 'ġhālib' mar gayā par yaad aatā hai\n" +
      "vo har ik baat par kahnā ki yuuñ hotā to kyā hotā",
    themes: ["memory", "wit"],
  },
  {
    poet: "Mirza Ghalib",
    devanagari: "न था कुछ तो ख़ुदा था कुछ न होता तो ख़ुदा होता\n" +
      "डुबोया मुझ को होने ने न होता मैं तो क्या होता",
    roman: "na thā kuchh to ḳhudā thā kuchh na hotā to ḳhudā hotā\n" +
      "Duboyā mujh ko hone ne na hotā maiñ to kyā hotā",
    themes: ["spiritual", "philosophy"],
  },
  {
    poet: "Mir Taqi Mir",
    devanagari: "पत्ता पत्ता बूटा बूटा हाल हमारा जाने है\n" +
      "जाने न जाने गुल ही न जाने बाग़ तो सारा जाने है",
    roman: "pattā pattā būTā būTā haal hamārā jaane hai\n" +
      "jaane na jaane gul hī na jaane baaġh to saarā jaane hai",
    themes: ["love", "sorrow"],
  },
  {
    poet: "Mir Taqi Mir",
    devanagari: "नाज़ुकी उस के लब की क्या कहिए\n" +
      "पंखुड़ी इक गुलाब की सी है",
    roman: "nāzukī us ke lab kī kyā kahiye\n" +
      "pañkhuḌī ik gulāb kī sī hai",
    themes: ["love", "beauty"],
  },
  {
    poet: "Mir Taqi Mir",
    devanagari: "'मीर' क्या सादे हैं बीमार हुए जिस के सबब\n" +
      "उसी अत्तार के लड़के से दवा लेते हैं",
    roman: "'mīr' kyā saade haiñ bīmār hue jis ke sabab\n" +
      "usī attār ke laḌke se davā lete haiñ",
    themes: ["love", "wit"],
  },
  {
    poet: "Khwaja Mir Dard",
    devanagari: "ज़िंदगी है या कोई तूफ़ान है\n" +
      "हम तो इस जीने के हाथों मर चले",
    roman: "zindagī hai yā koī tūfān hai\n" +
      "ham to is jiine ke hāthoñ mar chale",
    themes: ["sorrow", "philosophy"],
  },
  {
    poet: "Sheikh Ibrahim Zauq",
    devanagari: "अब तो घबरा के ये कहते हैं कि मर जाएँगे\n" +
      "मर के भी चैन न पाया तो किधर जाएँगे",
    roman: "ab to ghabrā ke ye kahte haiñ ki mar jā.eñge\n" +
      "mar ke bhī chain na paayā to kidhar jā.eñge",
    themes: ["despair", "philosophy"],
  },
  {
    poet: "Momin Khan Momin",
    devanagari: "तुम मिरे पास होते हो गोया\n" +
      "जब कोई दूसरा नहीं होता",
    roman: "tum mire paas hote ho goyā\n" +
      "jab koī dūsrā nahīñ hotā",
    themes: ["love", "longing"],
  },
  {
    poet: "Daagh Dehlvi",
    devanagari: "ख़ूब पर्दा है कि चिलमन से लगे बैठे हैं\n" +
      "साफ़ छुपते भी नहीं सामने आते भी नहीं",
    roman: "ḳhuub parda hai ki chilman se lage baiThe haiñ\n" +
      "saaf chhupte bhī nahīñ sāmne aate bhī nahīñ",
    themes: ["love", "beauty"],
  },
  {
    poet: "Bahadur Shah Zafar",
    devanagari: "उम्र-ए-दराज़ माँग के लाई थी चार दिन\n" +
      "दो आरज़ू में कट गए दो इंतिज़ार में",
    roman: "umr-e-darāz māñg ke laa.ī thī chaar din\n" +
      "do ārzū meñ kaT ga.e do intizār meñ",
    themes: ["longing", "sorrow"],
  },
  {
    poet: "Bahadur Shah Zafar",
    devanagari: "कितना है बद-नसीब 'ज़फ़र' दफ़्न के लिए\n" +
      "दो गज़ ज़मीन भी न मिली कू-ए-यार में",
    roman: "kitnā hai bad-nasīb 'zafar' dafn ke liye\n" +
      "do gaz zamīn bhī na milī kū-e-yār meñ",
    themes: ["sorrow", "exile"],
  },
  {
    poet: "Allama Iqbal",
    devanagari: "सारे जहाँ से अच्छा हिन्दोस्ताँ हमारा\n" +
      "हम बुलबुलें हैं इस की ये गुलसिताँ हमारा",
    roman: "saare jahāñ se achchhā hindostāñ hamārā\n" +
      "ham bulbuleñ haiñ is kī ye gulsitāñ hamārā",
    themes: ["patriotism", "hope"],
  },
];
