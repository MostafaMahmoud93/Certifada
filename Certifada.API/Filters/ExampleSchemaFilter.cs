using Microsoft.OpenApi.Any;
using Swashbuckle.AspNetCore.SwaggerGen;
namespace Certifada.API.Filters;
public class ExampleSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (context.Type == typeof(LoginModel))
        {
            schema.Example = new OpenApiObject
            {
                ["email"] = new OpenApiString("dev"),
                ["password"] = new OpenApiString("P@55w0rd")
            };
        }
    }
}