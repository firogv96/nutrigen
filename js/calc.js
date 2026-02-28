window.Calc = {
    // Calculates Daily Value percentage based on given standard
    percentage: function(amount, refAmount) {
        if (amount === undefined || amount === null || amount === '') return null;
        if (!refAmount || Number.isNaN(Number(refAmount))) return null;
        
        let perc = (Number(amount) / Number(refAmount)) * 100;
        
        // FDA rounding for %DV:
        // Round to nearest 2% up to 10%
        // Round to nearest 5% from 10% to 50%
        // Round to nearest 10% above 50%
        // Under 2% can be shown as 0%
        if (perc < 2) return 0;
        if (perc <= 10) return Math.round(perc / 2) * 2;
        if (perc <= 50) return Math.round(perc / 5) * 5;
        return Math.round(perc / 10) * 10;
    },
    
    // FDA Rounding Rules (21 CFR 101.9(c))
    roundFda: function(type, val) {
        val = Number(val);
        if (isNaN(val) || val === 0) return 0;

        switch (type) {
            case 'calories':
                if (val < 5) return 0;
                if (val <= 50) return Math.round(val / 5) * 5;
                return Math.round(val / 10) * 10;
            
            case 'totalFat':
            case 'satFat':
            case 'transFat':
            case 'polyFat':
            case 'monoFat':
            case 'totalCarbs':
            case 'dietaryFiber':
            case 'totalSugars':
            case 'addedSugars':
            case 'sugarAlcohol':
            case 'protein':
                if (val < 0.5) return 0;
                if (val < 5) return Math.round(val * 2) / 2; // nearest 0.5g
                return Math.round(val); // nearest 1g
            
            case 'cholesterol':
                if (val < 2) return 0;
                if (val <= 5) return 'less than 5'; // This might need special handling in string format
                return Math.round(val / 5) * 5;
            
            case 'sodium':
                if (val < 5) return 0;
                if (val <= 140) return Math.round(val / 5) * 5;
                return Math.round(val / 10) * 10;
            
            default:
                return val;
        }
    },
    
    // Auto calculate KJ from Macros/Cals
    calculateKj: function(kcal) {
        if (!kcal) return 0;
        return Math.round(Number(kcal) * 4.184);
    },
    
    // Convert Sodium (mg) to Salt (g) for EU
    sodiumToSalt: function(mgOfSodium) {
        if (!mgOfSodium) return 0;
        return ((Number(mgOfSodium) / 1000) * 2.5).toFixed(2);
    },
    
    formatNumber: function(num, decimalPlaces = 0, hideZero = false) {
        if (num === 'less than 5') return num;
        let val = Number(num);
        if (Number.isNaN(val)) return hideZero ? '' : '0';
        if (hideZero && val === 0) return '';
        
        return val % 1 !== 0 
            ? Number.isInteger(decimalPlaces) ? val.toFixed(decimalPlaces) : val.toString() 
            : val.toString();
    }
};
