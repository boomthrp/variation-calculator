# Expected Result Format

## Structure
Based on the example image, the result table should have:

1. **Header Rows** (Fixed):
   - Row 1: PLANT (grade names)
   - Row 2: MODEL
   - Row 3: DESTINATION
   - Row 4: GRADE (grade values)
   - Row 5: MT SET (blank or separator)

2. **Feature Rows** (Dynamic):
   - Column 1: FEATURE name
   - Column 2: ITEM name
   - Columns 3+: Data values (O, -, or .)

3. **Color Coding**:
   - Each column (grade) is color-coded based on which Variation Group it belongs to
   - Example: Yellow for one variation, Purple/Blue for others, Cyan for another
   - Columns with same pattern get same color

## Data Mapping
- **Feature Column (M)**: Contains feature names (TRANSMISSION, HANDLE, etc.)
- **Item Column (N)**: Contains item names (CYT, E-CVT, PH, etc.)
- **Data Columns (V onwards)**: Contains O (apply) or - (not apply) or . (not available)
- **Grade Row**: Contains grade values (SENRYU, URUSHI, etc.)

## Variation Grouping Logic
1. For each grade (column), determine which variation group it belongs to
2. This is based on the pattern of O/- across selected features
3. Group columns with identical patterns into same variation
4. Apply consistent color to all columns in same variation group

## Example Pattern Matching
If user selects:
- Feature: TRANSMISSION, Items: [CYT, E-CVT]
- Feature: HANDLE, Items: [PH]

Then for each grade column, check:
- Does TRANSMISSION row have O for CYT? 
- Does TRANSMISSION row have O for E-CVT?
- Does HANDLE row have O for PH?

If pattern matches a variation group's selection, color that column accordingly.
