import fs from 'fs';
import path from 'path';

// Page 1-5 data: NameToDisplay, Barcode, MRP, HSNCODE, SaleRate
const p1_5_raw = `
Aalu Falahari\t1017\t70.31\t210609(GST12)\t70.31
Aalu Sev\t1015\t75\t210609(GST12)\t75
Aam barfi\t102003\t600\t\t600
Aam Pak (1000 GM)\t101055\t600\t\t600
aamkhand (1000 GM)\t100043\t460\t\t460
AKHROT DOda kg\t101711\t700\t\t700
anjeer chikki (1000 GM)\t101090\t1400\t\t1400
ANJEER LADDU (1000 GM)\t102018\t1400\t\t1400
Badam\t1085\t1000\t\t1000
badam katli (1000 GM)\t101101\t1200\t\t1200
badam milk\t1112\t100\t2109(GST18)\t100
BANARASI LACCHE 200GM\t48\t140\t2106909(GST05)\t140
BANARASI LACCHE 400GM\t49\t280\t2106909(GST05)\t280
baraf gola\t1113\t22.24\t2109(GST18)\t22.24
BENGALI SWEETS\t102026\t560\t\t560
BENGALI SWEETS (1000 GM)\t0\t560\t\t560
besan chhaki (1000 GM)\t101057\t660\t\t660
besan ke laddu (1000 GM)\t101074\t660\t\t660
BHEL 250GM\t0\t65\t\t65
BHUTTA SEV 250GM\t0\t70.31\t\t70.31
chandra kala (1000 GM)\t101061\t600\t\t600
cheena murgi\t1038\t560\t\t560
chena tost (1000 GM)\t101027\t560\t\t560
chhapan bhog (1000 GM)\t101048\t600\t\t600
chhena islise (1000 GM)\t101036\t560\t\t560
chhena roll (1000 GM)\t101037\t560\t\t560
CHIPS-1\t1007\t55\t210609(GST12)\t55
CHIPS-2 200GM\t5001\t75\t\t75
CHOCLATE CAKE 200GM\t9\t140\t2106909(GST05)\t140
CHOCLATE CAKE 400GM\t10\t280\t2106909(GST05)\t280
CHOCLATE KACHORI 200GM\t27\t120\t2106909(GST05)\t120
CHOCLATE KACHORI 400GM\t28\t280\t2106909(GST05)\t280
CHOCLATE KAJU MALAI BITE (1000 GM)\t0\t1200\t\t1200
CHOCOLATE PATTI\t0\t280\t2106909(GST05)\t280
CHOCOLATE CELEBRITATION 250GM\t56\t200\t2106909(GST05)\t200
CHOCOLATE CELEBRITATION 500GM\t57\t400\t2106909(GST05)\t400
CHUNMUN 200GM\t11\t140\t2106909(GST05)\t140
CHUNMUN 400GM\t12\t280\t2106909(GST05)\t280
Dal Moth\t1011\t70.31\t210609(GST12)\t70.31
DANA 200 GM\t0\t70\t\t70
DANA BATI 200GM\t55\t100\t2106909(GST05)\t100
dandi kulfi\t201\t65\t2109(GST18)\t65
Delhi Mixture\t1020\t89.06\t210609(GST12)\t89.06
dibba parsal\t1107\t270\t2109(GST18)\t270
DIKKAD GAJAK 250GM\t50\t133.47\t2109(GST18)\t133.47
dona kulfi\t1106\t130\t2109(GST18)\t130
Dry Fruit bhujiy (1000 GM)\t101083\t1300\t\t1300
Dry Fruit laddu\t1104\t1400\t\t1400
DRY FRUIT BITES (1000 GM)\t0\t1200\t\t1200
DRY FRUIT CHIKKI (1000 GM)\t0\t1000\t\t1000
Dry Fruit Methai\t1082\t1000\t\t1000
dudh bundi ke laddu (1000 GM)\t101067\t660\t\t660
ENERGY LADDU (1000 1000gm)\t0\t800\t2106909(GST05)\t800
ENERGY LADDU KG\t0\t800\t\t800
Falhari Dana\t1019\t56.25\t210609(GST12)\t56.25
faluda kulfi\t1109\t180\t2109(GST18)\t180
Feni (1000 GM)\t101070\t860\t\t860
full bangali (1000 GM)\t101032\t440\t\t440
GAJAK CELEBRATION\t0\t660\t2106909(GST05)\t660
GAJAK CAKE 200GM\t5\t140\t2106909(GST05)\t140
GAJAK CAKE 400GM\t6\t280\t2106909(GST05)\t280
GAJAK DRY FRUIT ROLL (1000 GM)\t0\t700\t2106909(GST05)\t700
GAJAK KACHORI 200GM\t21\t140\t2106909(GST05)\t140
GAJAK KACHORI 400GM\t22\t280\t2106909(GST05)\t280
GAJAK KATALI (1000 GM)\t0\t800\t\t800
GAJAK LADDU 200GM\t2051\t130\t2106909(GST05)\t130
GAJAK LADDU 400GM\t2052\t260\t2106909(GST05)\t260
GAJAK MAWA GUPCHUP (1000 GM)\t0\t800\t2106909(GST05)\t800
GAJAK ROLL 200GM\t51\t120\t2106909(GST05)\t120
GAJAK ROLL 400GM\t52\t240\t2106909(GST05)\t240
gelef petha\t1078\t460\t\t460
Ghee Sweets\t1056\t500\t\t500
Ghever (1000 GM)\t101069\t860\t\t860
gol bangali\t1033\t560\t\t560
GOLDEN KACHORI 200GM\t23\t140\t2106909(GST05)\t140
GOLDEN KACHORI 400GM\t24\t280\t2106909(GST05)\t280
GOND GAJAK 200GM\t13\t140\t2106909(GST05)\t140
GOND GAJAK 400GM\t14\t280\t2106909(GST05)\t280
gond ke laddu (1000 GM)\t101073\t700\t\t700
GUD GAJAK 200GM\t1\t140\t2106909(GST05)\t140
GUD GAJAK 400GM\t2\t280\t2106909(GST05)\t280
GUD MEWA 200 GM\t33\t140\t2106909(GST05)\t140
GUD MEWA 400GM\t34\t280\t2106909(GST05)\t280
GUD PAPAD 200GM\t0\t130\t2106909(GST05)\t130
GUJIYA (1000 GM)\t101060\t600\t\t600
gujrati papdi\t1008\t80\t210609(GST12)\t80
gulab jamun (1000 GM)\t101079\t660\t\t660
Hing Sev\t1014\t70.31\t210609(GST12)\t70.31
JAIPURI PATTI 200GM\t54\t100\t2106909(GST05)\t100
Kabuli Chana\t1010\t65.62\t210609(GST12)\t65.62
kachori ,samosa, matri (1000 GM)\t101009\t400\t210609(GST12)\t400
KACHORI/SAMOSA 200GM\t0\t75\t\t75
Kaju\t1084\t1400\t\t1400
kaju kalas (1000 GM)\t101102\t1200\t\t1200
Kaju Katli (1000 GM)\t101081\t1200\t\t1200
kaju paak (1000 GM)\t101089\t1400\t\t1400
kaju parmal (1000 GM)\t101096\t1400\t\t1400
kaju roll\t1097\t1400\t\t1400
kalakand barfi\t1049\t600\t\t600
kale jaam\t1080\t600\t\t600
KARACHI HALWA (1000 GM)\t0\t1000\t2106909(GST05)\t1000
Kashmiri Mixture\t1021\t0\t210609(GST12)\t0
kasmiri chocklet\t1099\t600\t\t600
kasmiri rabadi\t1039\t500\t\t500
kesar bhog\t1025\t440\t\t440
kesar kaju katli\t1100\t1400\t\t1400
kesar mawa barfi (1000 GM)\t101047\t600\t\t600
kesar peda (1000 GM)\t101045\t600\t\t600
KESAR PETHA 250GM\t0\t80\t\t80
KESHAR BATI 200GM\t58\t120\t2106909(GST05)\t120
KESHAR BATI 400GM\t59\t240\t2106909(GST05)\t240
KHAJUR CHIKKI (1000 GM)\t0\t800\t\t800
khajur katlas (1000 GM)\t101091\t900\t\t900
khajur laddu (1000 GM)\t101092\t900\t\t900
KHAKHRA\t0\t0\t\t0
KHAKHRA 200 GM\t0\t0\t\t0
khasta bhujiya\t1062\t660\t\t660
KHOPRA PAK (1000 GM)\t102005\t600\t\t600
Kismis\t1086\t0\t\t0
KURKURI PATTI (1000 GM)\t0\t650\t2106909(GST05)\t650
LAL PATTI 200GM\t46\t100\t2106909(GST05)\t100
LAL PATTI 400GM\t47\t200\t2106909(GST05)\t200
lassi\t1110\t50\t2109(GST18)\t50
lochak bangali (1000 GM)\t1031\t440\t\t440
magaj ke laddu\t1071\t600\t\t600
Maida Namkeen 250g\t1024\t84.37\t210609(GST12)\t84.37
Makhana Tasty\t1022\t225\t210609(GST12)\t225
Makkhan bade (1000 GM)\t101058\t600\t\t600
makkhan petha (1000 GM)\t101065\t600\t\t600
MALAI BARFI (1000 GM)\t102001\t600\t\t600
malai chamchamp roll (1000 GM)\t101063\t660\t\t660
malai chap\t1028\t560\t\t560
Malai Doda (1000 GM)\t101052\t600\t\t600
MALAI GHEVAR 1 PCS\t50002\t260\t2106909(GST05)\t260
malai mesur paak (1000 GM)\t1076\t660\t\t660
malai white (1000 GM)\t101098\t1200\t\t1200
MARODI REWADI 200GM\t61\t130\t2106909(GST05)\t130
MATHARI 200GM\t0\t75\t\t75
MATHURA GAJAK 200GM\t17\t120\t2106909(GST05)\t120
MATHURA GAJAK 400GM\t18\t240\t2106909(GST05)\t240
Mathura Peda (1000 GM)\t101044\t600\t\t600
mava Barfi (1000 GM)\t101053\t460\t\t460
mava katlas (1000 GM)\t101050\t600\t\t600
mava roll\t1054\t460\t\t460
mawa bati (1000 GM)\t101064\t660\t\t660
MAWA REWADI 200GM\t19\t140\t2106909(GST05)\t140
MAWA REWADI 400GM\t20\t280\t2106909(GST05)\t280
MAWA SWEETS (1000 GM)\t0\t600\t\t600
mengo apsana (1000 GM)\t101093\t1000\t\t1000
mengo delite\t1094\t1000\t\t1000
mengo indrani\t1035\t440\t\t440
mesur paak (1000 GM)\t101075\t500\t\t500
MEWA MADHUR LADDU 200GM\t15\t140\t2106909(GST05)\t140
MEWA MADHUR LADDU 400GM\t16\t280\t2106909(GST05)\t280
milk cake (1000 GM)\t101051\t600\t\t600
MILK MYSORE (1000 GM)\t0\t500\t\t500
mini faluda\t1108\t88.98\t2109(GST18)\t88.98
MIX CAKE GAJAK 400GM\t50001\t280\t2106909(GST05)\t280
Mogar\t1012\t70.31\t210609(GST12)\t70.31
moong badam barfi\t1077\t660\t\t660
motichur ke laddu (1000 GM)\t101066\t660\t\t660
Namekeen (sada) (1000 GM)\t101001\t225\t210609(GST12)\t225
Namekeen 250g\t101003\t75\t210609(GST12)\t75
Namekeen 500g\t1004\t150\t210609(GST12)\t150
Namekeen Dry Fruit)\t1002\t356.25\t210609(GST12)\t356.25
Namkeen Kaju\t1088\t1000\t\t1000
panjabi kulfi\t0\t75\t2106909(GST05)\t75
panjabi kulfi 1\t9.9901E+13\t66.73\t\t66.73
PATISHA (1000 GM)\t0\t700\t\t700
PETHA 250GM\t0\t70\t\t70
Pista\t1087\t0\t\t0
pista bhog (1000 GM)\t101026\t600\t\t600
PISTA CAKE 200GM\t7\t140\t2106909(GST05)\t140
PISTA CAKE 400GM\t8\t280\t2106909(GST05)\t280
PISTA KAJU GAJAK (1000 GM)\t0\t1400\t\t1400
Plain Chips 100g\t1023\t28.12\t210609(GST12)\t28.12
rabdi (1000 GM)\t1116\t600\t2109(GST18)\t600
rabdi gola\t1114\t62.29\t2109(GST18)\t62.29
Raita Bundi\t1016\t70.31\t210609(GST12)\t70.31
RAJASTHANI LADDU (1000 GM)\t1068\t660\t\t660
Rajbhoj\t1041\t30\t\t30
rajwadi gola\t1115\t133.47\t2109(GST18)\t133.47
Rasbhari\t1030\t560\t\t560
Rasgulle 1 PCS\t1040\t20\t\t20
Rasmalai\t1034\t560\t\t560
REWADI 200GM\t31\t100\t2106909(GST05)\t100
Sabudana Falhari\t1018\t70.31\t210609(GST12)\t70.31
SADA GHEVAR 1 PCS\t50003\t160\t\t160
sahi doda (1000 GM)\t101059\t660\t\t660
sangam barfi (1000 GM)\t101095\t900\t\t900
SATTU LADDU (1000 GM)\t0\t660\t\t660
Sendwich\t1029\t560\t\t560
SESAME POPS 200GM\t37\t100\t2106909(GST05)\t100
SHAKKAR GAJAK 200GM\t3\t140\t2106909(GST05)\t140
SHAKKAR GAJAK 400GM\t4\t280\t2106909(GST05)\t280
SHAKKAR MEWA 200GM\t35\t140\t2106909(GST05)\t140
SHAKKAR MEWA 400GM\t36\t280\t2106909(GST05)\t280
SHAKKAR REWADI 200GM\t39\t100\t2106909(GST05)\t100
shreekhand\t101042\t360\t\t360
sikanji\t1111\t80\t2109(GST18)\t80
SONTH LADDOO KG(1000 GM)\t0\t1200\t2106909(GST05)\t1200
Special Namkeen 250g\t1005\t95\t210609(GST12)\t95
Special Namkeen 500g\t1006\t178.12\t210609(GST12)\t178.12
STEAM POHA 60GM\t0\t35\t\t35
STRAWBERRY KACHORI 200GM\t25\t140\t2106909(GST05)\t140
STRAWBERRY KACHORI 400GM\t26\t280\t2106909(GST05)\t280
SUPER PATTI 200GM\t40\t130\t2106909(GST05)\t130
SUPER PATTI 400GM\t41\t260\t2106909(GST05)\t260
tarde gajak 200GM\t0\t105\t2106909(GST05)\t105
tarde gajak 400GM\t0\t210\t\t210
TIKKAD GAJAK 200 GM\t60\t120\t2106909(GST05)\t120
TILL GOTI 200GM\t38\t100\t2106909(GST05)\t100
TILL LADDU PACK 250GM\t50005\t150\t\t150
TILL LADDU PACK 500GM\t50004\t300\t\t300
TILL LADU (1000 GM)\t29\t600\t2106909(GST05)\t600
TILL PAK (1000 GM)\t30\t600\t\t600
TILL PAPAD 250GM\t53\t250\t2106909(GST05)\t250
TILL PAPAD SHAKKAR 500GM\t0\t300\t2106909(GST05)\t300
TILL PATTI 200GM\t42\t130\t2106909(GST05)\t130
TILL PATTI 400GM\t43\t260\t2106909(GST05)\t260
TILL SHAKKARI 200GM\t44\t130\t2106909(GST05)\t130
TILL SHAKKARI 400GM\t45\t260\t2106909(GST05)\t260
Triple Long\t1013\t70.31\t210609(GST12)\t70.31
Urad/moong Laddu (1000 GM)\t101072\t700\t\t700
white peda (1000 GM)\t101046\t600\t\t600
`.trim().split(/\r?\n/);

// Page 6-10 data: Category, Alias, GroupName, Brand, Product, Unit1, ProdConv1
const p6_10_raw = `
NAMKEEN\t\tSHEETAL GAJAK\t\tAalu Falahari\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tAalu Sev\tPack\t1
Mava Mithai\t2003\tSHEETAL GAJAK\t\tAam barfi\tkg\t1
Mava Mithai\t\tSHEETAL GAJAK\t\tAam Pak\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\taamkhand\tKG\t1000
Mava Mithai\t1711\tSHEETAL GAJAK\t\tAKHROT DOda\tkg\t1
Dry Fruit\t\tSHEETAL GAJAK\t\tanjeer chikki\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tANJEER LADDU\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tBadam\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tbadam katli\tKG\t1000
KULFI\t\tSHEETAL GAJAK\t\tbadam milk\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tBANARASI LACCHE\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tBANARASI LACCHE\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\tbaraf gola\tPack\t1
Bengali Methai\t2026\tSHEETAL GAJAK\t\tBENGALI SWEETS\tKG\t1
Bengali Methai\t\tSHEETAL GAJAK\t\tBENGALI SWEETS\tKG\t1000
Ghee Sweets\t1057\tSHEETAL GAJAK\t\tbesan chhaki\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tbesan ke laddu\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tBHEL\tPack\t1
NAMKEEN\t1111\tSHEETAL GAJAK\t\tBHUTTA SEV\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tchandra kala\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tcheena murgi\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tchena tost\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tchhapan bhog\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tchhena islise\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tchhena roll\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tCHIPS-1\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tCHIPS-2\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHOCLATE CAKE\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHOCLATE CAKE\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHOCLATE KACHORI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHOCLATE KACHORI\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tCHOCLATE KAJU MALAI BITE\tKG\t1000
GAJAK\t1709\tSHEETAL GAJAK\t\tCHOCOLATE PATTI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHOCOLATE CELEBRITATION\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHOCOLATE CELEBRITATION\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHUNMUN\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tCHUNMUN\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tDal Moth\tPack\t1
NAMKEEN\t70\tSHEETAL GAJAK\t\tDANA\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tDANA BATI\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\tdandi kulfi\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tDelhi Mixture\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\tdibba parsal\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tDIKKAD GAJAK\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\tdona kulfi\tPack\t1
Dry Fruit\t\tSHEETAL GAJAK\t\tDry Fruit bhujiy\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tDry Fruit laddu\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tDRY FRUIT BITES\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tDRY FRUIT CHIKKI\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tDry Fruit Methai\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tdudh bundi ke laddu\tKG\t1000
GAJAK\t1710\tSHEETAL GAJAK\t\tENERGY LADDU\tkg\t1000
Ghee Sweets\t1710\tSHEETAL GAJAK\t\tENERGY LADDU\tGM\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tFalhari Dana\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\tfaluda kulfi\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tFeni\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tfull bangali\tKG\t1000
GAJAK\t1705\tSHEETAL GAJAK\t\tGAJAK CELEBRATION\tKG\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK CAKE\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK CAKE\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK DRY FRUIT ROLL\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK KACHORI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK KACHORI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK KATALI\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK LADDU\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK LADDU\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK MAWA GUPCHUP\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK ROLL\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGAJAK ROLL\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tgelef petha\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tGhee Sweets\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tGhever\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tgol bangali\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tGOLDEN KACHORI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGOLDEN KACHORI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGOND GAJAK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGOND GAJAK\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tgond ke laddu\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tGUD GAJAK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGUD GAJAK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGUD MEWA\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tGUD MEWA\tPack\t1
GAJAK\t1704\tSHEETAL GAJAK\t\tGUD PAPAD 200GM\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tGUJIYA\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tgujrati papdi\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tgulab jamun\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tHing Sev\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tJAIPURI PATTI\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tKabuli Chana\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tkachori ,samosa, matri\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tKACHORI/SAMOSA\tPack\t1
Dry Fruit\t\tSHEETAL GAJAK\t\tKaju\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tkaju kalas\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tKaju Katli\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tkaju paak\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tkaju parmal\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tkaju roll\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tkalakand barfi\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tkale jaam\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tKARACHI HALWA\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tKashmiri Mixture\tPack\t1
Dry Fruit\t\tSHEETAL GAJAK\t\tkasmiri chocklet\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tkasmiri rabadi\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tkesar bhog\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tkesar kaju katli\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tkesar mawa barfi\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tkesar peda\tKG\t1000
Mava Mithai\t1701\tSHEETAL GAJAK\t\tKESAR PETHA\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tKESHAR BATI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tKESHAR BATI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tKHAJUR CHIKKI\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tkhajur katlas\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tkhajur laddu\tKG\t1000
NAMKEEN\t1122\tSHEETAL GAJAK\t\tKHAKHRA\tPack\t1
NAMKEEN\t1703\tSHEETAL GAJAK\t\tKHAKHRA\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tkhasta bhujiya\tKG\t1000
Mava Mithai\t2005\tSHEETAL GAJAK\t\tKHOPRA PAK\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tKismis\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tKURKURI PATTI\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tLAL PATTI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tLAL PATTI\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\tlassi\tPack\t1
Bengali Methai\t\tSHEETAL GAJAK\t\tlochak bangali\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tmagaj ke laddu\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tMaida Namkeen 250g\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tMakhana Tasty\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tMakkhan bade\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tmakkhan petha\tKG\t1000
Mava Mithai\t2001\tSHEETAL GAJAK\t\tMALAI BARFI\tGM\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tmalai chamchamp roll\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tmalai chap\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tMalai Doda\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tMALAI GHEVAR\tPack\t1
Ghee Sweets\t1076\tSHEETAL GAJAK\t\tmalai mesur paak\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tmalai white\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tMARODI REWADI\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tMATHARI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tMATHURA GAJAK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tMATHURA GAJAK\tPack\t1
Mava Mithai\t\tSHEETAL GAJAK\t\tMathura Peda\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tmava Barfi\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tmava katlas\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\tmava roll\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tmawa bati\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tMAWA REWADI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tMAWA REWADI\tPack\t1
Mava Mithai\t\tSHEETAL GAJAK\t\tMAWA SWEETS\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tmengo apsana\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tmengo delite\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tmengo indrani\tKG\t1000
Ghee Sweets\t1075\tSHEETAL GAJAK\t\tmesur paak\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tMEWA MADHUR LADDU\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tMEWA MADHUR LADDU\tPack\t1
Mava Mithai\t\tSHEETAL GAJAK\t\tmilk cake\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tMILK MYSORE\tKG\t1000
KULFI\t\tSHEETAL GAJAK\t\tmini faluda\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tMIX CAKE GAJAK\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tMogar\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tmoong badam barfi\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tmotichur ke laddu\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tNamekeen (sada)\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tNamekeen 250g\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tNamekeen 500g\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tNamekeen Dry Fruit)\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tNamkeen Kaju\tKG\t1000
KULFI\t1111\tSHEETAL GAJAK\t\tpanjabi kulfi\tPack\t1
KULFI\t1121\tSHEETAL GAJAK\t\tpanjabi kulfi\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tPATISHA\tKG\t1000
Mava Mithai\t1702\tSHEETAL GAJAK\t\tPETHA\tPack\t1
Dry Fruit\t\tSHEETAL GAJAK\t\tPista\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tpista bhog\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tPISTA CAKE\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tPISTA CAKE\tPack\t1
Dry Fruit\t\tSHEETAL GAJAK\t\tPISTA KAJU GAJAK\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tPlain Chips 100g\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\trabdi\tKG\t1000
KULFI\t\tSHEETAL GAJAK\t\trabdi gola\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tRaita Bundi\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tRAJASTHANI LADDU\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tRajbhoj\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\trajwadi gola\tPack\t1
Bengali Methai\t\tSHEETAL GAJAK\t\tRasbhari\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tRasgulle\tPAC\t1
Bengali Methai\t\tSHEETAL GAJAK\t\tRasmalai\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tREWADI\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tSabudana Falhari\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tSADA GHEVAR\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tsahi doda\tKG\t1000
Dry Fruit\t\tSHEETAL GAJAK\t\tsangam barfi\tKG\t1000
Ghee Sweets\t\tSHEETAL GAJAK\t\tSATTU LADDU\tKG\t1000
Bengali Methai\t\tSHEETAL GAJAK\t\tSendwich\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tSESAME POPS\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSHAKKAR GAJAK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSHAKKAR GAJAK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSHAKKAR MEWA\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSHAKKAR MEWA\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSHAKKAR REWADI\tPack\t1
Bengali Methai\t\tSHEETAL GAJAK\t\tshreekhand\tPack\t1
KULFI\t\tSHEETAL GAJAK\t\tsikanji\tPack\t1
Ghee Sweets\t1708\tSHEETAL GAJAK\t\tSONTH LADDOO\tKG\t1000
NAMKEEN\t\tSHEETAL GAJAK\t\tSpecial Namkeen 250g\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tSpecial Namkeen 500g\tPack\t1
NAMKEEN\t1700\tSHEETAL GAJAK\t\tSTEAM POHA\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSTRAWBERRY KACHORI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSTRAWBERRY KACHORI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSUPER PATTI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tSUPER PATTI\tPack\t1
GAJAK\t1706\tSHEETAL GAJAK\t\ttarde gajak\tPack\t1
GAJAK\t1707\tSHEETAL GAJAK\t\ttarde gajak\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tTIKKAD GAJAK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tTILL GOTI\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tTILL LADDU PACK\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tTILL LADDU PACK\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tTILL LADU\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tTILL PAK\tKG\t1000
GAJAK\t\tSHEETAL GAJAK\t\tTILL PAPAD\tPack\t1
GAJAK\t71\tSHEETAL GAJAK\t\tTILL PAPAD SHAKKAR\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tTILL PATTI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tTILL PATTI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tTILL SHAKKARI\tPack\t1
GAJAK\t\tSHEETAL GAJAK\t\tTILL SHAKKARI\tPack\t1
NAMKEEN\t\tSHEETAL GAJAK\t\tTriple Long\tPack\t1
Ghee Sweets\t\tSHEETAL GAJAK\t\tUrad/moong Laddu\tKG\t1000
Mava Mithai\t\tSHEETAL GAJAK\t\twhite peda\tKG\t1000
`.trim().split(/\r?\n/);

console.log('Parsed ' + p1_5_raw.length + ' lines from p1-5 and ' + p6_10_raw.length + ' from p6-10');

const categoryMap = {
  'GAJAK': 'gajak',
  'KULFI': 'kulfi',
  'Mava Mithai': 'mava-mithai',
  'Ghee Sweets': 'ghee-sweets',
  'Bengali Methai': 'bengali-methai',
  'Dry Fruit': 'dry-fruit',
  'NAMKEEN': 'namkeen',
};

const products = [];
const seenIds = new Set();

for (let i = 0; i < p1_5_raw.length; i++) {
  const parts1 = p1_5_raw[i].split('\t');
  const nameToDisplay = parts1[0]?.trim();
  if (!nameToDisplay || nameToDisplay === 'DEMO PRODUCT') continue;
  const barcode = parts1[1]?.trim();
  const mrp = parseFloat(parts1[2]?.trim() || '0');
  const hsnRaw = parts1[3]?.trim() || '';
  const saleRate = parseFloat(parts1[4]?.trim() || parts1[2]?.trim() || '0');

  const parts2 = p6_10_raw[i] ? p6_10_raw[i].split('\t') : [];
  const rawCat = parts2[0]?.trim() || 'GAJAK';
  const alias = parts2[1]?.trim() || '';
  const unit1 = parts2[4]?.trim() || (nameToDisplay.includes('1000 GM') || nameToDisplay.includes('kg') ? 'KG' : 'Pack');

  const catId = categoryMap[rawCat] || 'gajak';

  // HSN code and GST rate extraction
  let hsnCode = '2106909';
  let taxRatePercent = 5;

  if (hsnRaw.includes('210609')) {
    hsnCode = '210609';
    taxRatePercent = 12;
  } else if (hsnRaw.includes('2109')) {
    hsnCode = '2109';
    taxRatePercent = 18;
  } else if (hsnRaw.includes('2106909')) {
    hsnCode = '2106909';
    taxRatePercent = 5;
  } else {
    if (catId === 'namkeen') {
      hsnCode = '210609';
      taxRatePercent = 12;
    } else if (catId === 'kulfi') {
      hsnCode = '2109';
      taxRatePercent = 18;
    } else {
      hsnCode = '2106909';
      taxRatePercent = 5;
    }
  }

  // Weight pack detection from name
  let packWeightKg;
  const lowerName = nameToDisplay.toLowerCase();
  if (lowerName.includes('200gm') || lowerName.includes('200 gm')) {
    packWeightKg = 0.2;
  } else if (lowerName.includes('250gm') || lowerName.includes('250g') || lowerName.includes('250 gm')) {
    packWeightKg = 0.25;
  } else if (lowerName.includes('400gm') || lowerName.includes('400 gm')) {
    packWeightKg = 0.4;
  } else if (lowerName.includes('500gm') || lowerName.includes('500g') || lowerName.includes('500 gm')) {
    packWeightKg = 0.5;
  } else if (lowerName.includes('1000 gm') || lowerName.includes('1000gm') || lowerName.includes('1000') || lowerName.includes('kg')) {
    packWeightKg = 1.0;
  } else if (lowerName.includes('100g') || lowerName.includes('100 g')) {
    packWeightKg = 0.1;
  } else if (lowerName.includes('60gm')) {
    packWeightKg = 0.06;
  }

  const isKg = unit1.toLowerCase() === 'kg';
  const unit = isKg ? 'kg' : 'piece';

  const slug = nameToDisplay
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  let id = 'prod_' + slug;
  if (seenIds.has(id)) {
    id = id + '_' + (i + 1);
  }
  seenIds.add(id);

  const sku = barcode && barcode !== '0' ? 'BAR-' + barcode : (alias ? 'ALS-' + alias : 'SKU-' + (1000 + i));

  products.push({
    id,
    sku,
    barcode: barcode && barcode !== '0' ? barcode : undefined,
    alias: alias || undefined,
    name: nameToDisplay,
    categoryId: catId,
    unit,
    packWeightKg,
    pricePerUnit: saleRate > 0 ? saleRate : mrp,
    taxRatePercent,
    hsnCode,
    isActive: true,
    requiresKitchen: catId === 'kulfi' || lowerName.includes('poha') || lowerName.includes('samosa') || lowerName.includes('kachori'),
    popularItem: [12, 13, 44, 46, 56, 60, 61, 80, 81, 95, 96, 120, 142].includes(i),
    standardWeights: isKg ? [0.25, 0.5, 1.0] : undefined,
    standardCounts: !isKg ? [1, 2, 4, 6] : undefined,
  });
}

console.log('Generated ' + products.length + ' products.');

const outTs = `import type { Category, Product } from '../types/index.ts';

export const SHEETAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Sweets & Snacks', description: 'Complete Sheetal Gajak Kulfi Catalog', iconName: 'Layers', displayOrder: 0 },
  { id: 'gajak', name: 'Sheetal Gajak', description: 'Til, Gud, Shakkar Gajak, Lacche, Roll & Rewadi', iconName: 'Sparkles', displayOrder: 1 },
  { id: 'kulfi', name: 'Kulfi & Drinks', description: 'Roll Kulfi, Dandi Kulfi, Faluda & Badam Milk', iconName: 'IceCream', displayOrder: 2 },
  { id: 'mava-mithai', name: 'Mava Mithai', description: 'Pure mawa barfi, bati, peda, kalakand & roll', iconName: 'Milk', displayOrder: 3 },
  { id: 'ghee-sweets', name: 'Desi Ghee Sweets', description: 'Pure desi ghee laddoos, ghevar, gulab jamun & halwa', iconName: 'Flame', displayOrder: 4 },
  { id: 'bengali-methai', name: 'Bengali Sweets', description: 'Rasgulla, Rasmalai, Chena toast, roll & sandwich', iconName: 'HeartHandshake', displayOrder: 5 },
  { id: 'dry-fruit', name: 'Dry Fruit Sweets', description: 'Kaju Katli, Anjeer Laddu, Chikki & Dry Fruit bites', iconName: 'Package', displayOrder: 6 },
  { id: 'namkeen', name: 'Namkeen & Snacks', description: 'Indore sev, falahari mixtures, chips & poha', iconName: 'UtensilsCrossed', displayOrder: 7 },
];

export const SHEETAL_PRODUCTS: Product[] = ` + JSON.stringify(products, null, 2) + `;\n`;

fs.writeFileSync(path.resolve('./src/demo/sheetalCatalog.ts'), outTs, 'utf-8');
console.log('Saved src/demo/sheetalCatalog.ts successfully!');
