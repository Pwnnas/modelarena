**Parsing cell references**

I’m working on parsing all cell references and their dependencies, including ranges. It seems like references like A101 and AA1 should produce a #REF error since they aren't valid. If there are unknown identifiers, I might run into function errors or issues with boolean literals. 

I also need to handle unary precedence correctly, like -2^2 should be interpreted as -(2^2). It looks like power has the highest precedence, is right associative, and I should consider grammar comparisons for parsing.**Implementing grid and highlights**

I’m considering how to enhance inputs by adding outline overlays based on references. I want to parse regex references and then color the corresponding cell outlines. It’s essential to highlight the cells or ranges, focusing on the input in the formula bar when clicked, allowing for easy commits with the enter key. I also need to ensure sticky headers for rows and columns in a CSS grid layout with 26 columns and 100 rows in the DOM.