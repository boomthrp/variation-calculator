# Example File Analysis: variation-analysis(7).xlsx

## File Structure
- **Sheet**: CAN
- **Dimensions**: 15 rows × 108 columns

## Data Layout
```
Row 1: PLANT header (HATC repeated)
Row 2: MODEL header (3JAA repeated)
Row 3: DESTINATION (Z, PH, Y, G, etc.)
Row 4: GRADE (HEVLOW, HEVMID, HEV RS, HEVLUX, etc.)
Row 5: Feature | Item | Variation Labels (A, B, C, etc.)
Row 6+: Feature data with O/- patterns
```

## Key Observations

### Column Structure
- **Column A**: Feature names (TRANSMISSION, HONDA SENSING TYPE, D>METER TYPE)
- **Column B**: Item names (CVT, E-CVT, HS 1V(E-ADAS), etc.)
- **Columns C onwards**: Data columns starting from C
  - Row 5 contains variation labels (A, B, C)
  - Rows 6+ contain O (apply) or - (not apply)

### Pattern Matching Logic
Looking at Row 5 (variation labels):
```
C5:A, D5:A, E5:B, F5:C, G5:A, H5:A, I5:B, J5:A, K5:A, L5:B, M5:A, N5:A, O5:B, P5:B, Q5:A, R5:A, S5:B, T5:B, U5:A, V5:A, W5:B, X5:B, Y5:B, Z5:C, AA5:C, AB5:C, AC5:A, AD5:A
```

### Example: TRANSMISSION > E-CVT (Row 7)
```
Row 7: A7:TRANSMISSION, B7:E-CVT, C7:O, D7:O, E7:O, F7:O, G7:O, H7:O, I7:O, J7:O, K7:O, L7:O, M7:O, N7:O, O7:O, P7:O, Q7:O, R7:O, S7:O, T7:O, U7:O, V7:O, W7:O, X7:O, Y7:O, Z7:O, AA7:O, AB7:O, AC7:O, AD7:O
```

All columns have "O", so this item applies to ALL variations (A, B, C).

### Example: HONDA SENSING TYPE > HS 360 GEN3 (Row 9)
```
Row 9: A9:HONDA SENSING TYPE, B9:HS 360 GEN3(P-ADAS HANDS ON), C9:-, D9:-, E9:-, F9:O, G9:-, H9:-, I9:-, J9:-, K9:-, L9:-, M9:-, N9:-, O9:-, P9:-, Q9:-, R9:-, S9:-, T9:-, U9:-, V9:-, W9:-, X9:-, Y9:-, Z9:O, AA9:O, AB9:O, AC9:-, AD9:-
```

- F9:O (Variation C - F5:C)
- Z9:O, AA9:O, AB9:O (Variations C, C, C - Z5:C, AA5:C, AB5:C)

So this item applies to Variation C only.

## Configuration Settings (Expected)
- **Feature Column**: A
- **Item Column**: B
- **Start Row**: 6 (first data row after headers)
- **Start Data Column**: C (first data column)

## Result Table Expected Output
Show only selected features (e.g., TRANSMISSION, HONDA SENSING TYPE, D>METER TYPE)
with their items, and color-code columns by variation group (A, B, C).
