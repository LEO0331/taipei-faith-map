import type { SourceReference } from '../faith-spaces/placeProfileTypes';
import type { HeritageContent, HistoricalDate } from './heritageTypes';

const reviewed = { lastReviewed: '2026-11-09', editorialReviewStatus: 'internal-reviewed' as const };
const source = (id: string, zh: string, en: string, url: string, publisher: string): SourceReference => ({
  id, title: { zh, en }, url, publisher, verifiedAt: reviewed.lastReviewed,
});
const xiahai = source('heritage-xiahai-boch', '文化部文化資產局：霞海城隍祭典記錄', 'Bureau of Cultural Heritage: Xia-Hai City God festival record',
  'https://tcmb.culture.tw/zh-tw/detail?id=20100726000001&indexCode=BOCH_CountryCulture_51', '文化部文化資產局');
const xiahaiSite = source('heritage-xiahai-ntut', '國立臺北科技大學：台北霞海城隍廟', 'National Taipei University of Technology: Taipei Xia-Hai City God Temple',
  'https://tcmb.culture.tw/zh-tw/detail?id=292346&indexCode=Culture_Object', '國立臺北科技大學文化事業發展學系');
const lee = source('heritage-lee-moi', '內政部：李春生紀念教會與郵便電信支局', 'Ministry of the Interior: Lee Memorial Church and the former post office',
  'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=356', '內政部');
const congregation = source('heritage-lee-pct', '台灣基督長老教會：李春生紀念教會資料', 'Presbyterian Church in Taiwan: Lee Memorial Church record',
  'https://www.pct.org.tw/churchdata.aspx?strOrgNo=C03001', '台灣基督長老教會');
const ciyou = source('heritage-ciyou-moi', '內政部：松山慈祐宮沿革與建築', 'Ministry of the Interior: Songshan Ciyou Temple history and architecture',
  'https://taiwangods.moi.gov.tw/Religious_Culture/html/landscape/1_0011.aspx?i=2', '內政部');
const ciyouLocal = source('heritage-ciyou-district', '松山區志編撰團隊：台北市松山慈祐宮', 'Songshan district history team: Taipei Songshan Ciyou Temple',
  'https://tcmb.culture.tw/zh-tw/detail?id=292304&indexCode=Culture_Place', '臺北市松山區公所暨松山社區大學《松山區志》編撰團隊');
const fude = source('heritage-fude-district', '松山區志編撰團隊：松山福德宮', 'Songshan district history team: Songshan Fude Temple',
  'https://tcmb.culture.tw/zh-tw/detail?id=292340&indexCode=Culture_Place', '臺北市松山區公所暨松山社區大學《松山區志》編撰團隊');

const year = (startYear: number): HistoricalDate => ({
  startYear, precision: 'year', calendarSystem: 'gregorian', displayLabel: { zh: `${startYear} 年`, en: String(startYear) },
});
const dadaocheng = 'dadaocheng-neighborhood-histories';
const songshan = 'songshan-from-xikou';
const xiahaiId = 'org-109-1vaoeq';
const leeId = 'org-335-mdesof';
const ciyouId = 'org-1-mtb4vg';
const fudeId = 'org-22-cu44hi';

export const neighborhoodHistories: HeritageContent = {
  places: [
    {
      organizationId: xiahaiId, organizationName: '台北霞海城隍廟', district: '大同區', address: '迪化街1段61號',
      relationship: { zh: '迪化街的目前登記場所，對應大稻埕廟宇的落成記錄。艋舺的前身場所未標示。', en: 'The current Dihua Street registration corresponds to the Dadaocheng completion record. The earlier Bangka site is unmapped.' },
      sources: [xiahai, xiahaiSite],
    },
    {
      organizationId: leeId, organizationName: '財團法人台北市李春生紀念基督長老教會', district: '大同區', address: '貴德街44號',
      relationship: { zh: '貴德街的現行登記堂會，對應原郵便電信支局的建物沿革。', en: 'The current Guide Street congregation is associated with the former post and telegraph office building.' },
      sources: [lee, congregation],
    },
    {
      organizationId: ciyouId, organizationName: '財團法人台北市松山慈祐宮', district: '松山區', address: '八德路4段761號',
      relationship: { zh: '八德路的目前登記場所，對應慈祐宮的沿革。現址座標不描繪昔日河岸或街廓。', en: 'The current Bade Road registration is associated with Ciyou Temple’s history. Its coordinates do not trace the former riverbank or street blocks.' },
      sources: [ciyou, ciyouLocal],
    },
    {
      organizationId: fudeId, organizationName: '松山福德宮', district: '松山區', address: '饒河街92號',
      relationship: { zh: '饒河街92號對應拓路後重建的場所，未標示拆除前的舊址。', en: 'No. 92 Raohe Street is the rebuilt location after road widening. The previous site is unmapped.' },
      sources: [fude],
    },
  ],
  milestones: [
    {
      id: 'xiahai-dadaocheng-completion-1859', title: { zh: '霞海城隍廟在大稻埕落成', en: 'Xia-Hai Temple completed in Dadaocheng' },
      summary: { zh: '文化資產記錄將大稻埕廟宇的落成定在1859年，並記述同安移民先前從艋舺移居的經過。', en: 'The heritage record dates completion of the Dadaocheng temple to 1859 and describes the earlier movement of Tong’an settlers from Bangka.' },
      date: year(1859), theme: 'architecture', organizationIds: [xiahaiId], storyIds: [dadaocheng], sources: [xiahai, xiahaiSite], ...reviewed,
    },
    {
      id: 'guide-post-office-relocation-1903', title: { zh: '郵便電信支局遷至貴德街現址', en: 'Post and telegraph office moves to the Guide Street site' },
      summary: { zh: '內政部資料記錄支局在1903年遷至日後作為教堂的建物，這是郵電用途的一個時間點。', en: 'The Ministry of the Interior records the office moving in 1903 to the building that later housed the church.' },
      date: year(1903), theme: 'transformation', organizationIds: [leeId], storyIds: [dadaocheng], sources: [lee], ...reviewed,
    },
    {
      id: 'lee-congregation-establishment-1935', title: { zh: '李春生紀念教會設立', en: 'Lee Memorial Church congregation established' },
      summary: { zh: '長老教會資料庫列出1935年5月5日為堂會設立日。', en: 'The Presbyterian Church in Taiwan directory lists May 5, 1935 as the congregation’s establishment date.' },
      date: { startYear: 1935, exactDate: '1935-05-05', precision: 'exact', calendarSystem: 'gregorian', displayLabel: { zh: '1935 年 5 月 5 日', en: 'May 5, 1935' } },
      theme: 'community', organizationIds: [leeId], storyIds: [dadaocheng], sources: [congregation], ...reviewed,
    },
    {
      id: 'lee-church-designation-2018', title: { zh: '原郵電建物與教堂列為市定古蹟', en: 'The former post office and church receive municipal heritage designation' },
      summary: { zh: '文化資產介紹列出2018年5月16日的公告，指定理由包括建物從公共服務轉為宗教用途的歷史。', en: 'The heritage profile lists the May 16, 2018 announcement and cites the building’s transition from public service to religious use among its reasons.' },
      date: { startYear: 2018, exactDate: '2018-05-16', precision: 'exact', calendarSystem: 'gregorian', displayLabel: { zh: '2018 年 5 月 16 日', en: 'May 16, 2018' } },
      theme: 'heritage', organizationIds: [leeId], storyIds: [dadaocheng], sources: [lee], ...reviewed,
    },
    {
      id: 'xikou-ciyou-completion-1757', title: { zh: '錫口媽祖宮完工', en: 'Completion of Xikou’s Mazu temple' },
      summary: { zh: '區志資料將1753年的建廟過程與1757年的完工分開記述。內政部資料亦記載1757年竣工。', en: 'The district history distinguishes the building effort in 1753 from completion in 1757. The Ministry of the Interior also gives 1757 as the completion year.' },
      date: year(1757), theme: 'architecture', organizationIds: [ciyouId], storyIds: [songshan], sources: [ciyou, ciyouLocal], ...reviewed,
    },
    {
      id: 'ciyou-stone-lions-1803', title: { zh: '慈祐宮石獅的雕刻年代', en: 'Carving date of Ciyou Temple’s stone lions' },
      summary: { zh: '內政部導覽將入口的一對石獅定年為1803年，也記述石獅曾在翻修過程中移離，後來重新安置。', en: 'The ministry guide dates the entrance lions to 1803 and describes their removal during renovation and subsequent reinstatement.' },
      date: year(1803), theme: 'architecture', organizationIds: [ciyouId], storyIds: [songshan], sources: [ciyou], ...reviewed,
    },
    {
      id: 'xikou-songshan-renaming-1920', title: { zh: '錫口與慈祐宮的名稱變遷', en: 'Name changes for Xikou and Ciyou Temple' },
      summary: { zh: '內政部沿革記載，錫口在1920年改稱松山，廟名也改為松山慈祐宮。', en: 'The ministry account records the renaming of Xikou to Songshan in 1920 and the adoption of the name Songshan Ciyou Temple.' },
      date: year(1920), theme: 'transformation', organizationIds: [ciyouId], storyIds: [songshan], sources: [ciyou], ...reviewed,
    },
    {
      id: 'songshan-fude-rebuilding-1982', title: { zh: '松山福德宮因拓路重建', en: 'Songshan Fude Temple rebuilds after road widening' },
      summary: { zh: '區志編撰資料記載，1982年的饒河街拓路使原址拆除，信眾籌資在92號現址重建。', en: 'The district history records demolition of the earlier site during the 1982 Raohe Street widening and rebuilding at No. 92 with contributions from worshippers.' },
      date: year(1982), theme: 'transformation', organizationIds: [fudeId], storyIds: [songshan], sources: [fude], ...reviewed,
    },
  ],
  stories: [
    {
      id: dadaocheng, title: { zh: '大稻埕兩條街，兩段場所史', en: 'Two streets, two histories in Dadaocheng' },
      subtitle: { zh: '從迪化街的城隍廟讀到貴德街的舊郵局', en: 'From Dihua Street’s City God temple to Guide Street’s former post office' },
      introduction: { zh: '迪化街的霞海城隍廟與貴德街的李春生紀念教會，各自保留街區的歷史線索。並讀兩站，可以認識移居、建築轉用與文化資產指定。', en: 'The Xia-Hai Temple on Dihua Street and Lee Memorial Church on Guide Street hold distinct clues to neighborhood history. Read them side by side to explore migration, adaptive reuse and heritage designation.' },
      conclusion: { zh: '同一個街區可以用不同年代閱讀。城隍廟的落成、郵電支局遷入、堂會設立與古蹟指定，分別說明場所變遷的一個階段。', en: 'Different dates reveal different parts of a neighborhood. Temple completion, the arrival of the post office, congregation establishment and heritage designation each identify a stage in the life of a place.' },
      theme: 'multi-faith', routeIds: ['dadaocheng-faith-and-community'],
      sources: [xiahai, xiahaiSite, lee, congregation], ...reviewed,
      chapters: [
        {
          id: 'a-temple-after-migration', title: { zh: '移居後的廟宇', en: 'A temple after migration' },
          content: { zh: '文化資產資料記錄同安移民由艋舺移往大稻埕後籌建廟宇。1859年的落成記錄讓我們從迪化街的現址回讀這段移居史。', en: 'The heritage record describes Tong’an settlers raising funds for a temple after moving from Bangka to Dadaocheng. The completion year, 1859, offers a way to read that migration history from the current Dihua Street site.' },
          milestoneIds: ['xiahai-dadaocheng-completion-1859'], organizationIds: [xiahaiId], sources: [xiahai, xiahaiSite],
        },
        {
          id: 'from-post-office-to-church', title: { zh: '一棟建物，兩種用途', en: 'One building, two uses' },
          content: { zh: '原郵便電信支局於1903年遷入日後作為教堂的建物。現在閱讀貴德街的教會，可以由這項記錄追溯建物曾承擔的公共服務。', en: 'The post and telegraph office moved into the future church building in 1903. At the present Guide Street church, that record gives a starting point for reading its earlier public-service role.' },
          milestoneIds: ['guide-post-office-relocation-1903'], organizationIds: [leeId], sources: [lee],
        },
        {
          id: 'a-congregation-and-a-designation', title: { zh: '堂會成立與古蹟指定', en: 'A congregation and a heritage designation' },
          content: { zh: '長老教會的資料提供堂會設立日期，政府的文化資產頁面則提供古蹟公告日期。前者說明宗教群體的成立，後者記錄建物受到保存制度認定的時間。', en: 'The church directory gives an establishment date for the congregation. The government heritage profile gives the designation date for the building. Each record answers a different historical question.' },
          milestoneIds: ['lee-congregation-establishment-1935', 'lee-church-designation-2018'], organizationIds: [leeId], sources: [congregation, lee],
        },
      ],
    },
    {
      id: songshan, title: { zh: '從錫口讀松山', en: 'Reading Songshan through Xikou' },
      subtitle: { zh: '沿著廟名、石獅與街道變遷探索', en: 'Follow temple names, stone lions and a changing street' },
      introduction: { zh: '從慈祐宮的廟名與石獅開始，再到福德宮的重建記錄。兩處場所讓舊地名、建築細節與街道變遷都能在今天的散步中找到閱讀線索。', en: 'Start with Ciyou Temple’s name and lions, then read the rebuilding record at Fude Temple. The two stops offer traces of an older place name, architectural details and street changes on a present-day walk.' },
      conclusion: { zh: '寺廟沿革留下不同尺度的記錄。完工是建築事件，石獅有自己的年代，廟名與街道則反映場所如何被重新辨識與使用。', en: 'Temple histories work at several scales. Completion dates a building event, the lions have their own chronology, and names and streets show how places are identified and used over time.' },
      theme: 'history', routeIds: ['songshan-raohe-temples'],
      sources: [ciyou, ciyouLocal, fude], ...reviewed,
      chapters: [
        {
          id: 'building-in-xikou', title: { zh: '在錫口集資建廟', en: 'Building a temple in Xikou' },
          content: { zh: '區志團隊的記錄將1753年的建廟過程與1757年的完工分開。早期的錫口廟名，也保留了今天松山街區的舊地名。', en: 'The district history distinguishes the building effort in 1753 from completion in 1757. The temple’s earlier Xikou name preserves an older name for today’s Songshan neighborhood.' },
          milestoneIds: ['xikou-ciyou-completion-1757'], organizationIds: [ciyouId], sources: [ciyou, ciyouLocal],
        },
        {
          id: 'stone-and-names', title: { zh: '石獅有年代，廟名也有', en: 'Stone lions and names have dates' },
          content: { zh: '入口石獅的年代可以與後來的翻修分開閱讀。到了1920年，錫口改稱松山，廟名也跟著改變。從一件構件到一個名稱，都有可查核的歷史線索。', en: 'The entrance lions have a carving date distinct from later renovations. In 1920 the shift from Xikou to Songshan was reflected in the temple’s name. Both an object and a name can offer a traceable historical clue.' },
          milestoneIds: ['ciyou-stone-lions-1803', 'xikou-songshan-renaming-1920'], organizationIds: [ciyouId], sources: [ciyou],
        },
        {
          id: 'raohe-changes', title: { zh: '街道拓寬後的福德宮', en: 'Fude Temple after the street widened' },
          content: { zh: '饒河街拓寬後，福德宮在現址重建。這段記錄讓散步者把眼前的街道與信眾的籌資行動並讀，並將目前門牌與先前位置分開。', en: 'Fude Temple was rebuilt at its current address after Raohe Street was widened. The record lets walkers read the street alongside the community’s fundraising and keep today’s address distinct from the earlier site.' },
          milestoneIds: ['songshan-fude-rebuilding-1982'], organizationIds: [fudeId], sources: [fude],
        },
      ],
    },
  ],
};
