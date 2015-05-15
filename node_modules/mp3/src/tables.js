/*
 * These are the scalefactor values for Layer I and Layer II.
 * The values are from Table B.1 of ISO/IEC 11172-3.
 *
 * Strictly speaking, Table B.1 has only 63 entries (0-62), thus a strict
 * interpretation of ISO/IEC 11172-3 would suggest that a scalefactor index of
 * 63 is invalid. However, for better compatibility with current practices, we
 * add a 64th entry.
 */
exports.SF_TABLE = new Float32Array([
    2.000000000000, 1.587401051968, 1.259921049895, 1.000000000000, 
    0.793700525984, 0.629960524947, 0.500000000000, 0.396850262992,
    0.314980262474, 0.250000000000, 0.198425131496, 0.157490131237,
    0.125000000000, 0.099212565748, 0.078745065618, 0.062500000000,
    0.049606282874, 0.039372532809, 0.031250000000, 0.024803141437,
    0.019686266405, 0.015625000000, 0.012401570719, 0.009843133202,
    0.007812500000, 0.006200785359, 0.004921566601, 0.003906250000,
    0.003100392680, 0.002460783301, 0.001953125000, 0.001550196340,
    0.001230391650, 0.000976562500, 0.000775098170, 0.000615195825,
    0.000488281250, 0.000387549085, 0.000307597913, 0.000244140625,
    0.000193774542, 0.000153798956, 0.000122070313, 0.000096887271,
    0.000076899478, 0.000061035156, 0.000048443636, 0.000038449739,
    0.000030517578, 0.000024221818, 0.000019224870, 0.000015258789,
    0.000012110909, 0.000009612435, 0.000007629395, 0.000006055454,
    0.000004806217, 0.000003814697, 0.000003027727, 0.000002403109,
    0.000001907349, 0.000001513864, 0.000001201554, 0.000000000000
]);

/*
 * MPEG-1 scalefactor band widths
 * derived from Table B.8 of ISO/IEC 11172-3
 */
const SFB_48000_LONG = new Uint8Array([
    4,  4,  4,  4,  4,  4,  6,  6,  6,   8,  10,
    12, 16, 18, 22, 28, 34, 40, 46, 54,  54, 192
]);

const SFB_44100_LONG = new Uint8Array([
    4,  4,  4,  4,  4,  4,  6,  6,  8,   8,  10,
    12, 16, 20, 24, 28, 34, 42, 50, 54,  76, 158
]);

const SFB_32000_LONG = new Uint8Array([
    4,  4,  4,  4,  4,  4,  6,  6,  8,  10,  12,
    16, 20, 24, 30, 38, 46, 56, 68, 84, 102,  26
]);

const SFB_48000_SHORT = new Uint8Array([
    4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,
    6,  6,  6,  6,  6, 10, 10, 10, 12, 12, 12, 14, 14,
    14, 16, 16, 16, 20, 20, 20, 26, 26, 26, 66, 66, 66
]);

const SFB_44100_SHORT = new Uint8Array([
    4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,
    6,  6,  8,  8,  8, 10, 10, 10, 12, 12, 12, 14, 14,
    14, 18, 18, 18, 22, 22, 22, 30, 30, 30, 56, 56, 56
]);

const SFB_32000_SHORT = new Uint8Array([
    4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,
    6,  6,  8,  8,  8, 12, 12, 12, 16, 16, 16, 20, 20,
    20, 26, 26, 26, 34, 34, 34, 42, 42, 42, 12, 12, 12
]);

const SFB_48000_MIXED = new Uint8Array([
    /* long */   4,  4,  4,  4,  4,  4,  6,  6,
    /* short */  4,  4,  4,  6,  6,  6,  6,  6,  6, 10,
    10, 10, 12, 12, 12, 14, 14, 14, 16, 16,
    16, 20, 20, 20, 26, 26, 26, 66, 66, 66
]);

const SFB_44100_MIXED = new Uint8Array([
    /* long */   4,  4,  4,  4,  4,  4,  6,  6,
    /* short */  4,  4,  4,  6,  6,  6,  8,  8,  8, 10,
    10, 10, 12, 12, 12, 14, 14, 14, 18, 18,
    18, 22, 22, 22, 30, 30, 30, 56, 56, 56
]);

const SFB_32000_MIXED = new Uint8Array([
    /* long */   4,  4,  4,  4,  4,  4,  6,  6,
    /* short */  4,  4,  4,  6,  6,  6,  8,  8,  8, 12,
    12, 12, 16, 16, 16, 20, 20, 20, 26, 26,
    26, 34, 34, 34, 42, 42, 42, 12, 12, 12
]);

/*
 * MPEG-2 scalefactor band widths
 * derived from Table B.2 of ISO/IEC 13818-3
 */
const SFB_24000_LONG = new Uint8Array([
    6,  6,  6,  6,  6,  6,  8, 10, 12,  14,  16,
   18, 22, 26, 32, 38, 46, 54, 62, 70,  76,  36
]);

const SFB_22050_LONG = new Uint8Array([
    6,  6,  6,  6,  6,  6,  8, 10, 12,  14,  16,
   20, 24, 28, 32, 38, 46, 52, 60, 68,  58,  54
]);

const SFB_16000_LONG = SFB_22050_LONG;

const SFB_24000_SHORT = new Uint8Array([
   4,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  8,
   8,  8, 10, 10, 10, 12, 12, 12, 14, 14, 14, 18, 18,
  18, 24, 24, 24, 32, 32, 32, 44, 44, 44, 12, 12, 12
]);

const SFB_22050_SHORT = new Uint8Array([
   4,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,
   6,  6,  8,  8,  8, 10, 10, 10, 14, 14, 14, 18, 18,
  18, 26, 26, 26, 32, 32, 32, 42, 42, 42, 18, 18, 18
]);

const SFB_16000_SHORT = new Uint8Array([
   4,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  8,
   8,  8, 10, 10, 10, 12, 12, 12, 14, 14, 14, 18, 18,
  18, 24, 24, 24, 30, 30, 30, 40, 40, 40, 18, 18, 18
]);

const SFB_24000_MIXED = new Uint8Array([
  /* long */   6,  6,  6,  6,  6,  6,
  /* short */  6,  6,  6,  8,  8,  8, 10, 10, 10, 12,
              12, 12, 14, 14, 14, 18, 18, 18, 24, 24,
              24, 32, 32, 32, 44, 44, 44, 12, 12, 12
]);

const SFB_22050_MIXED = new Uint8Array([
  /* long */   6,  6,  6,  6,  6,  6,
  /* short */  6,  6,  6,  6,  6,  6,  8,  8,  8, 10,
              10, 10, 14, 14, 14, 18, 18, 18, 26, 26,
              26, 32, 32, 32, 42, 42, 42, 18, 18, 18
]);

const SFB_16000_MIXED = new Uint8Array([
  /* long */   6,  6,  6,  6,  6,  6,
  /* short */  6,  6,  6,  8,  8,  8, 10, 10, 10, 12,
              12, 12, 14, 14, 14, 18, 18, 18, 24, 24,
              24, 30, 30, 30, 40, 40, 40, 18, 18, 18
]);

/*
 * MPEG 2.5 scalefactor band widths
 * derived from public sources
 */
const SFB_12000_LONG = SFB_16000_LONG;
const SFB_11025_LONG = SFB_12000_LONG;

const SFB_8000_LONG = new Uint8Array([
  12, 12, 12, 12, 12, 12, 16, 20, 24,  28,  32,
  40, 48, 56, 64, 76, 90,  2,  2,  2,   2,   2
]);

const SFB_12000_SHORT = SFB_16000_SHORT;
const SFB_11025_SHORT = SFB_12000_SHORT;

const SFB_8000_SHORT = new Uint8Array([
   8,  8,  8,  8,  8,  8,  8,  8,  8, 12, 12, 12, 16,
  16, 16, 20, 20, 20, 24, 24, 24, 28, 28, 28, 36, 36,
  36,  2,  2,  2,  2,  2,  2,  2,  2,  2, 26, 26, 26
]);

const SFB_12000_MIXED = SFB_16000_MIXED;
const SFB_11025_MIXED = SFB_12000_MIXED;

/* the 8000 Hz short block scalefactor bands do not break after
   the first 36 frequency lines, so this is probably wrong */
const SFB_8000_MIXED = new Uint8Array([
  /* long */  12, 12, 12,
  /* short */  4,  4,  4,  8,  8,  8, 12, 12, 12, 16, 16, 16,
              20, 20, 20, 24, 24, 24, 28, 28, 28, 36, 36, 36,
               2,  2,  2,  2,  2,  2,  2,  2,  2, 26, 26, 26
]);

exports.SFBWIDTH_TABLE = [
    { l: SFB_48000_LONG, s: SFB_48000_SHORT, m: SFB_48000_MIXED },
    { l: SFB_44100_LONG, s: SFB_44100_SHORT, m: SFB_44100_MIXED },
    { l: SFB_32000_LONG, s: SFB_32000_SHORT, m: SFB_32000_MIXED },
    { l: SFB_24000_LONG, s: SFB_24000_SHORT, m: SFB_24000_MIXED },
    { l: SFB_22050_LONG, s: SFB_22050_SHORT, m: SFB_22050_MIXED },
    { l: SFB_16000_LONG, s: SFB_16000_SHORT, m: SFB_16000_MIXED },
    { l: SFB_12000_LONG, s: SFB_12000_SHORT, m: SFB_12000_MIXED },
    { l: SFB_11025_LONG, s: SFB_11025_SHORT, m: SFB_11025_MIXED },
    { l:  SFB_8000_LONG, s:  SFB_8000_SHORT, m:  SFB_8000_MIXED }
];

exports.PRETAB = new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 3, 3, 2, 0
]);

/*
 * fractional powers of two
 * used for requantization and joint stereo decoding
 *
 * ROOT_TABLE[3 + x] = 2^(x/4)
 */
exports.ROOT_TABLE = new Float32Array([
    /* 2^(-3/4) */ 0.59460355750136,
    /* 2^(-2/4) */ 0.70710678118655,
    /* 2^(-1/4) */ 0.84089641525371,
    /* 2^( 0/4) */ 1.00000000000000,
    /* 2^(+1/4) */ 1.18920711500272,
    /* 2^(+2/4) */ 1.41421356237310,
    /* 2^(+3/4) */ 1.68179283050743
]);

exports.CS = new Float32Array([
    +0.857492926 , +0.881741997,
    +0.949628649 , +0.983314592,
    +0.995517816 , +0.999160558,
    +0.999899195 , +0.999993155
]);

exports.CA = new Float32Array([
    -0.514495755, -0.471731969,
    -0.313377454, -0.181913200,
    -0.094574193, -0.040965583,
    -0.014198569, -0.003699975
]);

exports.COUNT1TABLE_SELECT = 0x01;
exports.SCALEFAC_SCALE     = 0x02;
exports.PREFLAG            = 0x04;
exports.MIXED_BLOCK_FLAG   = 0x08;

exports.I_STEREO  = 0x1;
exports.MS_STEREO = 0x2;

/*
 * windowing coefficients for long blocks
 * derived from section 2.4.3.4.10.3 of ISO/IEC 11172-3
 *
 * WINDOW_L[i] = sin((PI / 36) * (i + 1/2))
 */
exports.WINDOW_L = new Float32Array([
    0.043619387, 0.130526192,
    0.216439614, 0.300705800,
    0.382683432, 0.461748613,
    0.537299608, 0.608761429,
    0.675590208, 0.737277337,
    0.793353340, 0.843391446,

    0.887010833, 0.923879533,
    0.953716951, 0.976296007,
    0.991444861, 0.999048222,
    0.999048222, 0.991444861,
    0.976296007, 0.953716951,
    0.923879533, 0.887010833,

    0.843391446, 0.793353340,
    0.737277337, 0.675590208,
    0.608761429, 0.537299608,
    0.461748613, 0.382683432,
    0.300705800, 0.216439614,
    0.130526192, 0.043619387
]);

/*
 * windowing coefficients for short blocks
 * derived from section 2.4.3.4.10.3 of ISO/IEC 11172-3
 *
 * WINDOW_S[i] = sin((PI / 12) * (i + 1/2))
 */
exports.WINDOW_S = new Float32Array([
    0.130526192, 0.382683432,
    0.608761429, 0.793353340,
    0.923879533, 0.991444861,
    0.991444861, 0.923879533,
    0.793353340, 0.608761429,
    0.382683432, 0.130526192
]);

/*
 * coefficients for intensity stereo processing
 * derived from section 2.4.3.4.9.3 of ISO/IEC 11172-3
 *
 * is_ratio[i] = tan(i * (PI / 12))
 * IS_TABLE[i] = is_ratio[i] / (1 + is_ratio[i])
 */
exports.IS_TABLE = new Float32Array([
    0.000000000,
    0.211324865,
    0.366025404,
    0.500000000,
    0.633974596,
    0.788675135,
    1.000000000
]);

/*
 * coefficients for LSF intensity stereo processing
 * derived from section 2.4.3.2 of ISO/IEC 13818-3
 *
 * IS_LSF_TABLE[0][i] = (1 / sqrt(sqrt(2)))^(i + 1)
 * IS_LSF_TABLE[1][i] = (1 /      sqrt(2)) ^(i + 1)
 */
exports.IS_LSF_TABLE = [
    new Float32Array([
        0.840896415,
        0.707106781,
        0.594603558,
        0.500000000,
        0.420448208,
        0.353553391,
        0.297301779,
        0.250000000,
        0.210224104,
        0.176776695,
        0.148650889,
        0.125000000,
        0.105112052,
        0.088388348,
        0.074325445
    ]), 
    new Float32Array([
        0.707106781,
        0.500000000,
        0.353553391,
        0.250000000,
        0.176776695,
        0.125000000,
        0.088388348,
        0.062500000,
        0.044194174,
        0.031250000,
        0.022097087,
        0.015625000,
        0.011048543,
        0.007812500,
        0.005524272
    ])
];

/*
 * scalefactor bit lengths
 * derived from section 2.4.2.7 of ISO/IEC 11172-3
 */
exports.SFLEN_TABLE = [
    { slen1: 0, slen2: 0 }, { slen1: 0, slen2: 1 }, { slen1: 0, slen2: 2 }, { slen1: 0, slen2: 3 },
    { slen1: 3, slen2: 0 }, { slen1: 1, slen2: 1 }, { slen1: 1, slen2: 2 }, { slen1: 1, slen2: 3 },
    { slen1: 2, slen2: 1 }, { slen1: 2, slen2: 2 }, { slen1: 2, slen2: 3 }, { slen1: 3, slen2: 1 },
    { slen1: 3, slen2: 2 }, { slen1: 3, slen2: 3 }, { slen1: 4, slen2: 2 }, { slen1: 4, slen2: 3 }    
];

/*
 * number of LSF scalefactor band values
 * derived from section 2.4.3.2 of ISO/IEC 13818-3
 */
exports.NSFB_TABLE = [
    [ [  6,  5,  5, 5 ],
      [  9,  9,  9, 9 ],
      [  6,  9,  9, 9 ] ],

    [ [  6,  5,  7, 3 ],
      [  9,  9, 12, 6 ],
      [  6,  9, 12, 6 ] ],

    [ [ 11, 10,  0, 0 ],
      [ 18, 18,  0, 0 ],
      [ 15, 18,  0, 0 ] ],

    [ [  7,  7,  7, 0 ],
      [ 12, 12, 12, 0 ],
      [  6, 15, 12, 0 ] ],

    [ [  6,  6,  6, 3 ],
      [ 12,  9,  9, 6 ],
      [  6, 12,  9, 6 ] ],

    [ [  8,  8,  5, 0 ],
      [ 15, 12,  9, 0 ],
      [  6, 18,  9, 0 ] ]
];
 