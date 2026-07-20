/**
 * Code Audit Static Analysis Test Cases
 * 
 * This file contains deliberate design smells, security flaws, style violations,
 * and duplicate code blocks for testing and demonstrating the Static Code Analysis Pipeline.
 */

// 1. Obsolete variables, loose equality, and unresolved TODO annotations
// TODO: Refactor this configuration helper before production launch
var globalConfig = "DEBUG_MODE";

function checkUserAccess(role: any, level: any) {
  // Loose equality check
  if (role == "Administrator") {
    console.log("Allowing full root access to administrator role");
    return true;
  }
  
  if (level == 10) {
    // Dangerous eval call for dynamic execution
    var script = "retrieveUserLevel(" + level + ")";
    eval(script);
    return true;
  }
  return false;
}

// 2. Security flaw: Hardcoded secret keys & credentials
var MOCK_API_KEY = "sk-live-52a8b9f140de77993a2c5e0094b8e3a2c";

// 3. Cognitive complexity: Heavily nested loops
function computeMatrixIntersections(matrixA: number[][], matrixB: number[][]) {
  var intersections: number[] = [];
  
  // Outer loop
  for (var i = 0; i < matrixA.length; i++) {
    // Nested loop 1
    for (var j = 0; j < matrixA[i].length; j++) {
      // Nested loop 2
      for (var k = 0; k < matrixB.length; k++) {
        // Nested loop 3
        for (var l = 0; l < matrixB[k].length; l++) {
          if (matrixA[i][j] === matrixB[k][l]) {
            console.log("Intersection found: " + matrixA[i][j]);
            intersections.push(matrixA[i][j]);
          }
        }
      }
    }
  }
  return intersections;
}

// 4. Bad practice: Empty catch blocks silently swallowing exceptions
function parseRemotePayload(jsonString: string) {
  try {
    var result = JSON.parse(jsonString);
    return result;
  } catch (error) {
    // Silently swallowing error
  }
  return null;
}

// 5. Duplicated Code block 1 (demonstrating duplicate logical blocks)
function calculateStandardTax(price: number, taxRate: number, discount: number) {
  var subtotal = price - discount;
  if (subtotal < 0) {
    subtotal = 0;
  }
  var taxAmount = subtotal * taxRate;
  var finalTotal = subtotal + taxAmount;
  console.log("Calculated final total: " + finalTotal);
  return finalTotal;
}

// 6. Duplicated Code block 2 (identical duplicate to trigger duplicate analyzer)
function calculateStandardTaxDuplicate(price: number, taxRate: number, discount: number) {
  var subtotal = price - discount;
  if (subtotal < 0) {
    subtotal = 0;
  }
  var taxAmount = subtotal * taxRate;
  var finalTotal = subtotal + taxAmount;
  console.log("Calculated final total: " + finalTotal);
  return finalTotal;
}
