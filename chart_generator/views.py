from django.shortcuts import render
import json
import io
import base64
import pandas as pd
import numpy as np

# Add these two lines BEFORE importing pyplot
import matplotlib
matplotlib.use('Agg') # Set the backend to Agg

import matplotlib.pyplot as plt # Now import pyplot
import seaborn as sns
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt # Use carefully - see note
from django.views.decorators.http import require_POST

# Create your views here.

# REMOVED Placeholder Data Generation - will load if tableData not provided
# def get_placeholder_data(): ... 

# Use csrf_exempt only if you understand the security implications,
# especially if your app will be accessible publicly.
# A better approach is to handle CSRF tokens correctly in your frontend fetch.
@csrf_exempt
@require_POST # Ensure this view only accepts POST requests
def generate_chart_view(request):
    try:
        config = json.loads(request.body)
        chart_type = config.get('type')
        title = config.get('title', 'Generated Chart')
        x_col_name = config.get('xCol')
        y_col_name = config.get('yCol')
        category_col_name = config.get('categoryCol')
        value_col_name = config.get('valueCol')
        x_label = config.get('xLabel')
        y_label = config.get('yLabel')

        # --- Load Data --- 
        df = None
        use_provided_data = False
        table_data = config.get('tableData')

        if table_data and isinstance(table_data, list) and len(table_data) > 0:
            try:
                df = pd.DataFrame(table_data)
                # --- Attempt numeric conversion after loading --- 
                for col in df.columns:
                    # errors='coerce' will turn non-numeric values into NaN
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                # Optionally, drop columns that are entirely NaN after conversion
                # df.dropna(axis=1, how='all', inplace=True)
                # Optionally, drop rows where all numeric columns are NaN? Maybe too aggressive.
                # --- End numeric conversion ---
                use_provided_data = True
                print("Successfully loaded data from frontend tableData and attempted numeric conversion.")
                print("DataFrame info after conversion:")
                df.info() # Print info AFTER conversion
            except Exception as e:
                print(f"Error converting tableData to DataFrame or numeric: {e}")
                # Fallback to placeholder data if conversion fails
                use_provided_data = False
        else:
            print("No valid tableData found in request, using placeholder data.")
            use_provided_data = False

        # Fallback to placeholder data if not provided or failed to load
        if not use_provided_data:
            # Define placeholder data inline if needed as fallback
             df_numeric_placeholder = pd.DataFrame(np.random.rand(50, 2) * 100, columns=['Random_X', 'Random_Y'])
             df_categorical_placeholder = pd.DataFrame({
                 'Category': np.random.choice(['A', 'B', 'C', 'D', 'E'], 50),
                 'Value': np.random.randint(10, 100, 50)
             })
             # Assign one of the placeholders to df based on expected chart type? Or handle in each block.
             # For now, specific chart blocks will handle using the correct placeholder.

    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON data")
    except Exception as e:
        return HttpResponseBadRequest(f"Error parsing request: {e}")

    plt.figure(figsize=(10, 6)) # Create a new figure for each request

    try:
        # --- Chart Generation Logic ---
        if chart_type == 'scatter':
            if use_provided_data and x_col_name and y_col_name and x_col_name in df.columns and y_col_name in df.columns:
                # Convert columns to numeric if possible for plotting
                df[x_col_name] = pd.to_numeric(df[x_col_name], errors='coerce')
                df[y_col_name] = pd.to_numeric(df[y_col_name], errors='coerce')
                plt.scatter(df[x_col_name], df[y_col_name])
                plt.xlabel(x_label if x_label else x_col_name)
                plt.ylabel(y_label if y_label else y_col_name)
            else:
                # Fallback to placeholder
                plt.scatter(df_numeric_placeholder['Random_X'], df_numeric_placeholder['Random_Y'])
                plt.xlabel(x_label if x_label else 'Random_X')
                plt.ylabel(y_label if y_label else 'Random_Y')

        elif chart_type == 'histogram':
            data_to_plot = None
            col_label = 'Value'
            if use_provided_data and x_col_name and x_col_name in df.columns:
                data_to_plot = pd.to_numeric(df[x_col_name], errors='coerce').dropna()
                col_label = x_label if x_label else x_col_name
            else:
                # Fallback to placeholder
                data_to_plot = df_numeric_placeholder['Random_X']
                col_label = x_label if x_label else 'Random_X'
            
            if data_to_plot is not None and not data_to_plot.empty:
                plt.hist(data_to_plot, bins=10)
                plt.xlabel(col_label)
                plt.ylabel(y_label if y_label else 'Frequency')
            else:
                 raise ValueError(f"No valid numeric data found for histogram column: {x_col_name or 'placeholder'}")

        elif chart_type == 'barchart':
            if use_provided_data:
                print("Generating bar chart with provided data. DataFrame info:") 
                df.info()
                # Ensure all data columns are numeric for plotting against index
                numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
                if not numeric_cols:
                    raise ValueError("Bar chart requires at least one numeric column in the provided data.")
                
                plot_df = df[numeric_cols].copy()
                plot_df.index.name = 'Row Index' # Use index for x-axis
                
                # Use pandas plot for grouped bar chart
                plot_df.plot(kind='bar', ax=plt.gca()) # Use current axes
                plt.xlabel(x_label if x_label else 'Row Index')
                plt.ylabel(y_label if y_label else 'Values')
                plt.xticks(rotation=0) # Keep index labels horizontal
                # Legend should be automatic
            else:
                # Fallback to placeholder countplot
                print("Generating bar chart with placeholder data (countplot).")
                category_column_name = 'Category' 
                sns.countplot(x=category_column_name, data=df_categorical_placeholder, palette='viridis', ax=plt.gca())
                plt.xlabel(x_label if x_label else category_column_name)
                plt.ylabel(y_label if y_label else 'Count')

        elif chart_type == 'piechart':
            if use_provided_data and category_col_name and category_col_name in df.columns:
                counts = df[category_col_name].value_counts()
                # Optional: Use value_col_name for weights if provided and valid
                if value_col_name and value_col_name in df.columns:
                     try:
                         # Attempt to use value column for weights - requires careful aggregation
                         # Simple approach: sum values per category (might not be always desired)
                         weights = df.groupby(category_col_name)[value_col_name].sum()
                         counts = weights[counts.index] # Align with category labels
                     except Exception as e:
                         print(f"Could not use value column for pie chart weights: {e}, using counts instead.")
                         counts = df[category_col_name].value_counts()
                else:
                     counts = df[category_col_name].value_counts()

                if not counts.empty:
                     plt.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=90)
                     plt.axis('equal')
                else:
                     raise ValueError(f"No data found for pie chart category column: {category_col_name}")
            else:
                # Fallback to placeholder pie chart
                category_column_name = 'Category'
                counts = df_categorical_placeholder[category_column_name].value_counts()
                plt.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=90)
                plt.axis('equal')

        # --- NEW CHART TYPES --- 
        elif chart_type == 'line':
            y_cols_selected = config.get('yCols', []) # Get list of selected Y columns
            use_different_styles = config.get('useDifferentLineStyles', False) # Get style flag
            
            if use_provided_data:
                if not y_cols_selected:
                     raise ValueError("No Y-axis columns selected for line chart.")

                numeric_df = df.select_dtypes(include=np.number)
                plotted_cols_count = 0
                # Define line styles to cycle through
                line_styles = ['-', '--', ':', '-.'] 
                style_index = 0

                for y_col_name in y_cols_selected:
                    if y_col_name in numeric_df.columns:
                         current_style = line_styles[style_index % len(line_styles)] if use_different_styles else '-'
                         # Plot each selected numeric column against the index
                         plt.plot(numeric_df.index, numeric_df[y_col_name], marker='o', linestyle=current_style, label=y_col_name)
                         plotted_cols_count += 1
                         style_index += 1 # Increment style index only if a line was plotted
                    else:
                         print(f"Warning: Selected column '{y_col_name}' not found or not numeric, skipping.")
                
                if plotted_cols_count == 0:
                    raise ValueError("None of the selected Y-axis columns contain valid numeric data.")
                
                plt.xlabel(x_label if x_label else 'Row Index')
                plt.ylabel(y_label if y_label else 'Values')
                plt.xticks(numeric_df.index) # Ensure ticks match the row indices
                plt.legend()
                plt.grid(True)
                
            else:
                 # Fallback to placeholder (plot Random_Y vs index)
                 df_numeric_placeholder.reset_index().plot(kind='line', x='index', y='Random_Y', marker='o', ax=plt.gca())
                 plt.xlabel(x_label if x_label else 'Index')
                 plt.ylabel(y_label if y_label else 'Random_Y')
                 plt.legend()
                 plt.grid(True)

        elif chart_type == 'boxplot':
            boxplot_col_name = config.get('boxplotCol') # Primary column (used only if category is valid categorical)
            boxplot_category_col = config.get('boxplotCategoryCol') # Optional grouping
            if use_provided_data:
                numeric_df = df.select_dtypes(include=np.number)
                if numeric_df.empty:
                    raise ValueError("Box plot requires numeric data.")

                # --- Revised Logic --- 
                perform_grouped_boxplot = False
                if boxplot_category_col and boxplot_category_col in df.columns:
                    # Check if the selected category column is NOT numeric
                    if not pd.api.types.is_numeric_dtype(df[boxplot_category_col]):
                         if not boxplot_col_name or boxplot_col_name not in numeric_df.columns:
                             raise ValueError("Grouped box plot requires a valid numeric column selection.")
                         perform_grouped_boxplot = True
                    else:
                        print(f"Selected category column '{boxplot_category_col}' is numeric. Plotting all numeric columns instead.")
                
                if perform_grouped_boxplot:
                     # Grouped boxplot (Category column is non-numeric)
                     print(f"Generating grouped box plot: y='{boxplot_col_name}', x='{boxplot_category_col}'")
                     # Ensure the numeric column is numeric for plotting
                     plot_data = df[[boxplot_col_name, boxplot_category_col]].copy()
                     plot_data[boxplot_col_name] = pd.to_numeric(plot_data[boxplot_col_name], errors='coerce')
                     plot_data = plot_data.dropna(subset=[boxplot_col_name])

                     sns.boxplot(x=plot_data[boxplot_category_col], y=plot_data[boxplot_col_name], ax=plt.gca())
                     plt.xlabel(boxplot_category_col) 
                     plt.ylabel(y_label if y_label else boxplot_col_name) 
                     plt.xticks(rotation=45, ha='right')
                else:
                     # Plot all numeric columns side-by-side
                     # (Handles: no category selected OR selected category is numeric)
                     print("Generating box plot for all numeric columns.")
                     if numeric_df.shape[1] == 0:
                        raise ValueError("No numeric columns found for box plot.")
                     sns.boxplot(data=numeric_df, ax=plt.gca())
                     plt.ylabel(y_label if y_label else "Values")
            else:
                 # Fallback placeholder (boxplot of Value grouped by Category)
                 sns.boxplot(x='Category', y='Value', data=df_categorical_placeholder, ax=plt.gca())
                 plt.ylabel(y_label if y_label else 'Value')

        elif chart_type == 'heatmap':
            if use_provided_data:
                numeric_df = df.select_dtypes(include=np.number)
                if numeric_df.empty:
                     raise ValueError("Heatmap requires numeric data.")
                # --- MODIFIED: Plot the dataframe directly, not the correlation matrix ---
                print("Generating heatmap of DataFrame values.")
                sns.heatmap(numeric_df, annot=True, cmap='viridis', fmt=".2f", linewidths=.5, ax=plt.gca()) 
                # Removed correlation_matrix = numeric_df.corr()
                # if numeric_df.shape[1] < 2: # No longer require 2 columns for this type of heatmap
                #    raise ValueError("Heatmap requires at least two numeric columns.")
            else:
                 # Fallback: heatmap of placeholder numeric data (still correlation for now)
                 # Or, alternatively, plot the placeholder numeric df values?
                 # Let's keep placeholder as correlation for contrast.
                 print("Generating heatmap of placeholder data correlation.")
                 correlation_matrix = df_numeric_placeholder.corr()
                 sns.heatmap(correlation_matrix, annot=True, cmap='viridis', fmt=".2f", ax=plt.gca())
            # Title is set later

        elif chart_type == 'bubble':
             size_col_name = config.get('sizeCol')
             color_col_name = config.get('colorCol') # Optional
             if use_provided_data and x_col_name and y_col_name and size_col_name and \
                x_col_name in df.columns and y_col_name in df.columns and size_col_name in df.columns:
                 
                 df[x_col_name] = pd.to_numeric(df[x_col_name], errors='coerce')
                 df[y_col_name] = pd.to_numeric(df[y_col_name], errors='coerce')
                 df[size_col_name] = pd.to_numeric(df[size_col_name], errors='coerce')
                 
                 plot_df = df.dropna(subset=[x_col_name, y_col_name, size_col_name])
                 
                 # Basic size scaling (adjust multiplier as needed)
                 sizes = (plot_df[size_col_name] - plot_df[size_col_name].min() + 1) * 20 

                 scatter_args = {
                     'x': plot_df[x_col_name],
                     'y': plot_df[y_col_name],
                     's': sizes,
                     'alpha': 0.6
                 }

                 # Handle optional color column
                 color_data = None
                 if color_col_name and color_col_name in plot_df.columns:
                     # Try numeric conversion for continuous color map, else treat as categorical
                     color_data_numeric = pd.to_numeric(plot_df[color_col_name], errors='coerce')
                     if not color_data_numeric.isnull().all():
                         scatter_args['c'] = color_data_numeric
                         scatter_args['cmap'] = 'viridis'
                         color_data = color_data_numeric # Store for colorbar
                     else:
                          # Use categorical coloring (requires mapping categories to colors, 
                          # or let matplotlib handle it if few categories)
                          scatter_args['c'] = pd.factorize(plot_df[color_col_name])[0] 
                          scatter_args['cmap'] = 'tab10' # Example categorical map

                 scatter_plot = plt.scatter(**scatter_args)
                 plt.xlabel(x_label if x_label else x_col_name)
                 plt.ylabel(y_label if y_label else y_col_name)
                 
                 # Add legend for size (tricky, often requires manual proxy artists)
                 # Simple text description instead:
                 plt.text(0.99, 0.01, f'Bubble size represents {size_col_name}', 
                          verticalalignment='bottom', horizontalalignment='right', 
                          transform=plt.gca().transAxes, fontsize=9)

                 # Add color bar if color data is numeric
                 if color_data is not None and pd.api.types.is_numeric_dtype(color_data):
                     cbar = plt.colorbar(scatter_plot)
                     cbar.set_label(color_col_name)

             else:
                 # Fallback placeholder - maybe scatter with random size/color?
                 sizes = np.random.rand(50) * 100
                 colors = np.random.rand(50)
                 plt.scatter(df_numeric_placeholder['Random_X'], df_numeric_placeholder['Random_Y'], s=sizes, c=colors, alpha=0.6, cmap='viridis')
                 plt.xlabel(x_label if x_label else 'Random_X')
                 plt.ylabel(y_label if y_label else 'Random_Y')
                 plt.colorbar(label='Random Color')

        else:
            return HttpResponseBadRequest(f"Unsupported chart type: {chart_type}")

        # Apply title from config (common to all plots)
        plt.title(title)

        # --- Save plot to memory buffer ---
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.close() # Close the figure to free memory
        buf.seek(0)

        # --- Encode image to Base64 ---
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        image_data_url = f"data:image/png;base64,{image_base64}"

        return JsonResponse({'image_data': image_data_url})

    except Exception as e:
        plt.close()
        # Return the specific ValueError message if it's the heatmap check
        if isinstance(e, ValueError) and "Heatmap requires" in str(e):
            return JsonResponse({'error': str(e)}, status=400) # Bad Request status
        # Otherwise, return a generic 500 error
        return JsonResponse({'error': f'Failed to generate chart: {e}'}, status=500)
