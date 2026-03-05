#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char *argv[]) {
    // Default values
    char *input_file = NULL;
    char *output_file = "default_output.txt";  // Default output file

    // Parse command-line arguments
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-o") == 0) {
            // Check if next argument exists
            if (i + 1 < argc) {
                output_file = argv[i + 1];
                i++;  // Skip the next argument since we've used it
            } else {
                fprintf(stderr, "Error: -o option requires a filename\n");
                return 1;
            }
        } else if (input_file == NULL) {
            // First non-option argument is the input file
            input_file = argv[i];
        } else {
            fprintf(stderr, "Error: Unexpected argument '%s'\n", argv[i]);
            return 1;
        }
    }

    // Check if input file was provided
    if (input_file == NULL) {
        fprintf(stderr, "Usage: %s <input_file> [-o output_file]\n", argv[0]);
        return 1;
    }

    // Print the parsed arguments (for demonstration)
    printf("Input file: %s\n", input_file);
    printf("Output file: %s\n", output_file);

    // Here you would typically:
    // 1. Open input_file for reading
    // 2. Open output_file for writing
    // 3. Process your data
    // 4. Close files

    return 0;
}
