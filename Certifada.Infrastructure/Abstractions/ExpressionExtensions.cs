namespace Certifada.Infrastructure.Abstractions
{
    public static class ExpressionExtensions
    {
        public static string GetPropertyName<T, TValue>(this Expression<Func<T, TValue>> expression)
        {
            if (expression.Body is MemberExpression member)
                return member.Member.Name;

            if (expression.Body is UnaryExpression unary && unary.Operand is MemberExpression memberExpression)
                return memberExpression.Member.Name;

            throw new InvalidOperationException("Invalid expression");
        }
    }
}
