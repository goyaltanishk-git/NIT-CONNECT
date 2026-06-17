-- ==========================================
-- BEFORE INSERT TRIGGER TO AUTO-FILL GRADUATION BATCH AND YEAR OF STUDY
-- Runs on new profile insertion (e.g. Vercel backend verification inserts)
-- ==========================================

CREATE OR REPLACE FUNCTION public.autofill_graduation_details()
RETURNS trigger AS $$
DECLARE
  v_prefix text;
  v_digits text;
  v_entry_year int;
  v_grad_batch int;
  v_year_of_study text;
BEGIN
  -- Only execute if graduation_batch or year_of_study is null
  IF NEW.graduation_batch IS NULL OR NEW.year_of_study IS NULL THEN
    v_prefix := split_part(NEW.email, '@', 1);
    v_digits := regexp_replace(v_prefix, '\D', '', 'g');
    v_entry_year := 2023; -- default fallback B.Tech entry year (graduation 2027)
    
    -- 1. Try to find a 4-digit year starting with 20 (e.g. 2023, 2024)
    IF v_prefix ~ '20(2[0-9]|3[0-9])' THEN
      v_entry_year := (regexp_matches(v_prefix, '20(2[0-9]|3[0-9])'))[1]::int;
    -- 2. NIT Kurukshetra style 9-digit roll number (e.g. 123103075) -> 2nd & 3rd digit is 23
    ELSIF length(v_digits) >= 8 THEN
      DECLARE
        v_short_yr int := substring(v_digits from 2 for 2)::int;
      BEGIN
        IF v_short_yr >= 20 AND v_short_yr <= 35 THEN
          v_entry_year := 2000 + v_short_yr;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Fallback if conversion fails
        v_entry_year := 2023;
      END;
    -- 3. Short prefix style starting with entry year digits (e.g. 231075 -> starts with 23)
    ELSIF length(v_digits) >= 2 THEN
      DECLARE
        v_short_yr int := substring(v_digits from 1 for 2)::int;
      BEGIN
        IF v_short_yr >= 20 AND v_short_yr <= 35 THEN
          v_entry_year := 2000 + v_short_yr;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Fallback if conversion fails
        v_entry_year := 2023;
      END;
    END IF;
    
    -- Compute B.Tech graduation batch
    v_grad_batch := v_entry_year + 4;
    
    -- Determine year of study string as of 2026
    IF v_grad_batch = 2026 THEN 
      v_year_of_study := '4th Year';
    ELSIF v_grad_batch = 2027 THEN 
      v_year_of_study := '3rd Year';
    ELSIF v_grad_batch = 2028 THEN 
      v_year_of_study := '2nd Year';
    ELSIF v_grad_batch = 2029 THEN 
      v_year_of_study := '1st Year';
    ELSE
      -- Fallback calculation based on current year 2026
      CASE 2026 - v_entry_year
        WHEN 1 THEN v_year_of_study := '1st Year';
        WHEN 2 THEN v_year_of_study := '2nd Year';
        WHEN 3 THEN v_year_of_study := '3rd Year';
        WHEN 4 THEN v_year_of_study := '4th Year';
        ELSE v_year_of_study := 'Alumni';
      END CASE;
    END IF;
    
    -- Fill the values in the NEW row if they are currently null
    IF NEW.graduation_batch IS NULL THEN
      NEW.graduation_batch := v_grad_batch;
    END IF;
    IF NEW.year_of_study IS NULL THEN
      NEW.year_of_study := v_year_of_study;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_autofill_graduation_details ON public.profiles;
CREATE TRIGGER trigger_autofill_graduation_details
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.autofill_graduation_details();
